const $ = (selector) => document.querySelector(selector);
const state = {
  products: [], cart: JSON.parse(localStorage.getItem("bluevita-cart") || "[]"),
  token: localStorage.getItem("bluevita-token") || "", user: JSON.parse(localStorage.getItem("bluevita-user") || "null"),
  authMode: "login", currentView: "home", currentProduct: null
};
const money = n => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`/api${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
  return data;
}
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2400);
}
function saveCart() { localStorage.setItem("bluevita-cart", JSON.stringify(state.cart)); updateCartCount(); }
function updateCartCount() { $("#cartCount").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0); }
function showView(name) {

  // ป้องกันสมาชิกทั่วไปเข้าหน้าแอดมิน
  if (
    (name === "admin" || name === "dashboard") &&
    state.user?.role !== "admin"
  ) {
    name = "account";
  }

  state.currentView = name;

  // แสดงเฉพาะหน้าที่เลือก
  document.querySelectorAll(".view").forEach(el => {
    el.hidden = el.id !== `${name}View`;
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (name === "shop") renderShop();
  if (name === "cart") renderCart();
  if (name === "orders") renderOrders();
  if (name === "detail") renderProductDetail();
  if (name === "rewards") renderRewards();
  if (name === "admin") renderAdmin();
  if (name === "dashboard") renderDashboard();
  if (name === "account") updateAccountUI();
}
  state.currentView = name;
  document.querySelectorAll(".view").forEach(el => el.hidden = el.id !== `${name}View`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "shop") renderShop();
  if (name === "cart") renderCart();
  if (name === "orders") renderOrders();
  if (name === "detail") renderProductDetail();
  if (name === "rewards") renderRewards();
  if (name === "admin") renderAdmin();
  if (name === "account") updateAccountUI();
}
function productCard(p) {
  const image = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">` : "";
  return `<article class="product-card">
    <button class="product-image product-open" data-detail="${escapeHtml(p.id)}" aria-label="อ่านรายละเอียด ${escapeHtml(p.name)}">${image}<span class="product-placeholder">✚</span><span class="image-view-label">ดูรายละเอียด ↗</span></button>
    <div class="product-info"><span class="product-category">${escapeHtml(p.category)}</span>
    <button class="product-title-link" data-detail="${escapeHtml(p.id)}"><h3>${escapeHtml(p.name)}</h3></button>
    <p>${escapeHtml(p.description)}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${escapeHtml(p.id)}" aria-label="เพิ่ม ${escapeHtml(p.name)} ลงตะกร้า" ${p.stock < 1 ? "disabled" : ""}>${p.stock < 1 ? "หมด" : "＋"}</button></div><small class="stock-note">${p.stock > 0 ? `พร้อมส่ง · เหลือ ${p.stock} ชิ้น` : "สินค้าหมดชั่วคราว"}</small>
    <button class="detail-link" data-detail="${escapeHtml(p.id)}">รายละเอียดและรีวิว <span>→</span></button></div></article>`;
}
async function loadProducts() {
  state.products = await api("/products");
  $("#featuredProducts").innerHTML = state.products.filter(p => p.featured).map(productCard).join("") || '<div class="empty-state">ยังไม่มีสินค้าแนะนำ</div>';
  renderShop();
}
function renderShop() {
  if (!state.products.length) return;
  const q = ($("#searchInput")?.value || "").trim().toLowerCase();
  const category = $("#categoryFilter")?.value || "ทั้งหมด";
  const sort = $("#sortFilter")?.value || "default";
  let list = state.products.filter(p => (!q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)) && (category === "ทั้งหมด" || p.category === category));
  if (sort === "low") list.sort((a,b) => a.price-b.price);
  if (sort === "high") list.sort((a,b) => b.price-a.price);
  $("#allProducts").innerHTML = list.length ? list.map(productCard).join("") : '<div class="empty-state">ไม่พบสินค้าที่ค้นหา ลองใช้คำอื่นดูนะ</div>';
}
async function renderProductDetail() {
  const p = state.products.find(item => item.id === state.currentProduct);
  const target = $("#productDetail");
  if (!p) { target.innerHTML = '<div class="empty-state">ไม่พบสินค้า <button class="button button-primary" data-view="shop">กลับไปเลือกสินค้า</button></div>'; return; }
  target.innerHTML = `<button class="back-link" data-view="shop">← กลับไปสินค้าทั้งหมด</button>
    <div class="detail-layout"><div class="detail-image">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">` : ""}<span class="detail-image-mark">✚</span></div>
    <div class="detail-copy"><span class="product-category">${escapeHtml(p.category)}</span><h1>${escapeHtml(p.name)}</h1><div class="detail-price">${money(p.price)}</div><p class="detail-description">${escapeHtml(p.description)}</p>
    <div class="detail-facts"><div><span>สถานะ</span><b>${p.stock > 0 ? "มีสินค้า" : "สินค้าหมด"}</b></div><div><span>คงเหลือ</span><b>${p.stock} ชิ้น</b></div><div><span>รีวิว</span><b id="reviewCount">กำลังโหลด…</b></div></div>
    <button class="button button-primary detail-add" data-add="${escapeHtml(p.id)}" ${p.stock < 1 ? "disabled" : ""}>เพิ่มลงตะกร้า · ${money(p.price)}</button>
    <div class="info-box"><h3>📋 ข้อมูลที่ควรอ่านก่อนใช้</h3><p><b>ส่วนประกอบและปริมาณ:</b> โปรดตรวจสอบจากฉลากสินค้าจริง ข้อมูลนี้เป็นหน้าร้านตัวอย่างและยังไม่มีเอกสารยืนยันส่วนประกอบเฉพาะรุ่น</p><p><b>วิธีใช้:</b> ปฏิบัติตามคำแนะนำบนฉลากผลิตภัณฑ์เท่านั้น ไม่ควรเดาปริมาณรับประทานจากชื่อสินค้า</p><p><b>ข้อควรระวัง:</b> หากตั้งครรภ์ มีโรคประจำตัว แพ้อาหาร หรือใช้ยาประจำ ควรปรึกษาแพทย์หรือเภสัชกรก่อนใช้</p></div>
    </div></div><section class="reviews-section"><div class="section-heading"><div><span class="eyebrow">COMMUNITY NOTES</span><h2>รีวิวจากผู้ซื้อ</h2></div></div><div id="productReviews" class="review-list"><p>กำลังโหลดรีวิว…</p></div></section>`;
  try {
    const reviews = await api(`/products/${encodeURIComponent(p.id)}/reviews`);
    $("#reviewCount").textContent = `${reviews.length} รีวิว`;
    $("#productReviews").innerHTML = reviews.length ? reviews.map(r => `<article class="review-card"><div class="review-card-head"><b>${escapeHtml(r.name)}</b><span>${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</span></div><p>${escapeHtml(r.comment)}</p><small>${new Date(r.createdAt).toLocaleDateString("th-TH")}</small></article>`).join("") : '<div class="empty-state compact">ยังไม่มีรีวิวแรกของสินค้านี้</div>';
  } catch { $("#productReviews").innerHTML = '<p class="muted">ยังโหลดรีวิวไม่ได้ในขณะนี้</p>'; }
}
async function renderRewards() {
  const el = $("#rewardsContent");
  if (!state.user) { el.innerHTML = '<div class="empty-state"><h3>เข้าสู่ระบบเพื่อดูคะแนน</h3><button class="button button-primary" data-view="account">เข้าสู่ระบบ / สมัครสมาชิก</button></div>'; return; }
  try {
    const data = await api("/rewards");
    el.innerHTML = `<div class="points-banner"><div><span>คะแนนสะสมของคุณ</span><strong>${data.points} <small>คะแนน</small></strong><p>รีวิวสินค้าที่ซื้อและจัดส่งแล้ว รับ 1 คะแนนต่อสินค้า 1 รายการ (รีวิวซ้ำไม่ได้)</p></div><span class="points-icon">✦</span></div>
    <h2 class="subheading">รายการที่รีวิวได้</h2>${data.eligible.length ? data.eligible.map(item => `<article class="review-eligible"><div><b>${escapeHtml(item.productName)}</b><small>คำสั่งซื้อ ${escapeHtml(item.orderId)} · จัดส่งแล้ว</small></div><form class="review-form" data-review-order="${escapeHtml(item.orderId)}" data-review-product="${escapeHtml(item.productId)}"><label>ให้คะแนน<select name="rating"><option value="5">★★★★★ ดีมาก</option><option value="4">★★★★☆ ดี</option><option value="3">★★★☆☆ ปานกลาง</option><option value="2">★★☆☆☆ พอใช้</option><option value="1">★☆☆☆☆ ควรปรับปรุง</option></select></label><label>รีวิว<textarea name="comment" minlength="3" maxlength="500" required placeholder="เล่าประสบการณ์การซื้อของคุณ (3–500 ตัวอักษร)"></textarea></label><button class="button button-primary" type="submit">ส่งรีวิว รับ 1 คะแนน</button></form></article>`).join("") : '<div class="empty-state compact">ยังไม่มีรายการที่รีวิวได้ ต้องเป็นสินค้าที่ซื้อและมีสถานะจัดส่งแล้วเท่านั้น</div>'}`;
  } catch (e) { el.innerHTML = `<div class="empty-state">${escapeHtml(e.message)}</div>`; }
}
function addToCart(id) {
  const p = state.products.find(item => item.id === id); if (!p) return;
  const existing = state.cart.find(item => item.id === id);
  if ((existing?.quantity || 0) >= p.stock) return toast("สินค้าในสต็อกมีไม่พอ");
  if (existing) existing.quantity++; else state.cart.push({ id, quantity: 1 });
  saveCart(); toast("เพิ่มสินค้าลงตะกร้าแล้ว");
}
function cartRows() {
  return state.cart.map(item => {
    const p = state.products.find(product => product.id === item.id);
    if (!p) return "";
    return `<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><small>${money(p.price)} / ชิ้น</small></div><div class="qty-control"><button data-qty="${p.id}" data-delta="-1" aria-label="ลดจำนวน">−</button><span>${item.quantity}</span><button data-qty="${p.id}" data-delta="1" aria-label="เพิ่มจำนวน" ${item.quantity >= p.stock ? "disabled" : ""}>+</button><button class="danger-button" data-remove="${p.id}">ลบ</button></div><span class="price">${money(p.price * item.quantity)}</span></div>`;
  }).join("");
}
function renderCart() {
  const content = $("#cartContent");
  const validItems = state.cart.filter(item => state.products.some(p => p.id === item.id));
  state.cart = validItems; saveCart();
  if (!validItems.length) { content.innerHTML = '<div class="empty-state"><div style="font-size:42px">🛒</div><h3>ตะกร้ายังว่างอยู่</h3><p>เลือกสินค้าที่สนใจ แล้วกลับมาสั่งซื้อได้ที่นี่</p><button class="button button-primary" data-view="shop">เลือกชมสินค้า</button></div>'; return; }
  const total = validItems.reduce((sum, item) => sum + state.products.find(p => p.id === item.id).price * item.quantity, 0);
  content.innerHTML = `<div class="cart-layout"><div class="cart-list">${cartRows()}</div><div class="summary-card"><h3>สรุปคำสั่งซื้อ</h3><div class="summary-line"><span>จำนวนสินค้า</span><span>${validItems.reduce((s,i)=>s+i.quantity,0)} ชิ้น</span></div><div class="summary-line"><span>ค่าจัดส่ง</span><span>คำนวณภายหลัง</span></div><div class="summary-line summary-total"><span>รวมสินค้า</span><span>${money(total)}</span></div><form id="checkoutForm" class="checkout-form"><h3>ข้อมูลจัดส่ง</h3><label>ชื่อผู้รับ<input name="shippingName" required></label><label>เบอร์โทรศัพท์<input name="phone" type="tel" required></label><label>ที่อยู่จัดส่ง<textarea name="address" rows="3" required></textarea></label><button class="button button-primary full" type="submit">ยืนยันคำสั่งซื้อ</button><small style="color:#7b8da0">เดโมนี้ยังไม่เชื่อมระบบชำระเงินจริง</small></form></div></div>`;
}
async function checkout(form) {
  if (!state.user) {
    toast("เข้าสู่ระบบก่อนสั่งซื้อนะ");
    showView("account");
    return;
  }

  const fd = new FormData(form);

  try {
    const result = await api("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: state.cart,
        shippingName: fd.get("shippingName"),
        phone: fd.get("phone"),
        address: fd.get("address")
      })
    });

    // เก็บรายการสินค้าที่ซื้อไว้สำหรับหน้าต่างรีวิว
    const purchasedItems = result.order.items.map(item => ({
      id: item.id,
      name: item.name,
      orderId: result.order.id
    }));

    state.cart = [];
    saveCart();

    await loadProducts();

    // แจ้งว่าซื้อสำเร็จ
    alert(
      `สั่งซื้อสำเร็จ! 🎉\n` +
      `เลขที่คำสั่งซื้อ: ${result.order.id}`
    );

    // เปิดหน้าต่างรีวิวทันทีหลังสั่งซื้อ
    await showPurchaseReviews(purchasedItems);

    showView("orders");

  } catch (e) {
    toast(e.message);
  }
}
async function showPurchaseReviews(items) {
  if (!items.length) return;

  let index = 0;
  let submittedCount = 0;

  // สร้างหน้าต่างรีวิว
  let modal = document.getElementById("purchaseReviewModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "purchaseReviewModal";

    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(20, 40, 70, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        width: 100%;
        max-width: 440px;
        padding: 25px;
        border-radius: 22px;
        box-shadow: 0 15px 50px rgba(0,0,0,.18);
        color: #243b53;
      ">
        <div style="text-align:center;font-size:38px">⭐</div>
        <h2 style="text-align:center;margin:8px 0">
          รีวิวสินค้าของคุณ
        </h2>
        <p id="purchaseReviewProgress"
           style="text-align:center;color:#718096;font-size:13px"></p>

        <h3 id="purchaseReviewProduct"
            style="font-size:18px;margin:20px 0 12px"></h3>

        <label style="display:block;font-weight:600;margin-bottom:8px">
          ให้คะแนนสินค้า
        </label>

        <div id="purchaseReviewStars"
             style="display:flex;justify-content:center;gap:10px;margin-bottom:20px">
          ${[1, 2, 3, 4, 5].map(n => `
            <button type="button"
              data-review-star="${n}"
              style="border:0;background:none;font-size:32px;cursor:pointer;padding:2px">
              ☆
            </button>
          `).join("")}
        </div>

        <label for="purchaseReviewComment"
               style="display:block;font-weight:600;margin-bottom:8px">
          ความคิดเห็นของคุณ
        </label>

        <textarea id="purchaseReviewComment"
          minlength="3"
          maxlength="500"
          placeholder="แชร์ประสบการณ์การใช้สินค้านี้ (อย่างน้อย 3 ตัวอักษร)"
          style="
            width:100%;
            box-sizing:border-box;
            min-height:110px;
            padding:12px;
            border:1px solid #d6e2ef;
            border-radius:12px;
            font:inherit;
            resize:vertical;
          "></textarea>

        <p id="purchaseReviewMessage"
           style="color:#d14343;font-size:13px;min-height:18px"></p>

        <button id="purchaseReviewSubmit"
          class="button button-primary"
          style="width:100%;margin-bottom:10px">
          ส่งรีวิว รับ 1 คะแนน
        </button>

        <button id="purchaseReviewSkip"
          type="button"
          style="
            width:100%;
            border:0;
            background:transparent;
            padding:10px;
            color:#718096;
            cursor:pointer;
          ">
          ไว้รีวิวภายหลัง
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  let rating = 5;
  let finished = false;

  const productTitle = modal.querySelector("#purchaseReviewProduct");
  const progress = modal.querySelector("#purchaseReviewProgress");
  const stars = modal.querySelector("#purchaseReviewStars");
  const comment = modal.querySelector("#purchaseReviewComment");
  const message = modal.querySelector("#purchaseReviewMessage");
  const submit = modal.querySelector("#purchaseReviewSubmit");
  const skip = modal.querySelector("#purchaseReviewSkip");

  function updateStars() {
    stars.querySelectorAll("[data-review-star]").forEach(button => {
      const value = Number(button.dataset.reviewStar);
      button.textContent = value <= rating ? "★" : "☆";
      button.style.color = value <= rating ? "#f4b400" : "#b5c1cf";
    });
  }

  function cleanup() {
    modal.style.display = "none";
    stars.removeEventListener("click", onStarClick);
    submit.removeEventListener("click", onSubmit);
    skip.removeEventListener("click", onSkip);
  }

  function onStarClick(event) {
    const button = event.target.closest("[data-review-star]");
    if (!button) return;

    rating = Number(button.dataset.reviewStar);
    updateStars();
  }

  function finish() {
    if (finished) return;
    finished = true;
    cleanup();

    if (submittedCount > 0) {
      toast(`ส่งรีวิวแล้ว ${submittedCount} รายการ รับ ${submittedCount} คะแนน 🎉`);
    }
  }

  function onSkip() {
    finish();
  }

  async function onSubmit() {
    const text = comment.value.trim();

    if (text.length < 3 || text.length > 500) {
      message.textContent = "กรุณาเขียนรีวิว 3–500 ตัวอักษร";
      return;
    }

    submit.disabled = true;
    message.textContent = "กำลังบันทึกรีวิว...";

    const item = items[index];

    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({
          orderId: item.orderId,
          productId: item.id,
          rating,
          comment: text
        })
      });

      submittedCount++;

      // อัปเดตคะแนนในข้อมูลผู้ใช้ที่หน้าเว็บเก็บไว้
      try {
        const me = await api("/auth/me");
        state.user = me.user;
        localStorage.setItem("bluevita-user", JSON.stringify(state.user));
        updateAccountUI();
      } catch (_) {}

      index++;

      if (index >= items.length) {
        finish();
        return;
      }

      renderCurrentItem();

    } catch (e) {
      message.textContent = e.message;
    } finally {
      submit.disabled = false;
    }
  }

  function renderCurrentItem() {
    rating = 5;
    comment.value = "";
    message.textContent = "";
    progress.textContent = `รายการที่ ${index + 1} จาก ${items.length}`;
    productTitle.textContent = items[index].name;
    submit.textContent = "ส่งรีวิว รับ 1 คะแนน";
    updateStars();
  }

  stars.addEventListener("click", onStarClick);
  submit.addEventListener("click", onSubmit);
  skip.addEventListener("click", onSkip);

  modal.style.display = "flex";
  renderCurrentItem();

  // รอให้ผู้ใช้ส่งรีวิวหรือกดข้าม
  await new Promise(resolve => {
    const originalCleanup = cleanup;

    cleanup = function () {
      originalCleanup();
      resolve();
    };
  });
}


function updateAccountUI() {
  const signedIn = Boolean(state.user);
  const isAdmin = state.user?.role === "admin";

  $("#accountButton").textContent =
    signedIn ? state.user.name : "เข้าสู่ระบบ";

  $("#adminNav").hidden = !isAdmin;
  $("#dashboardNav").hidden = !isAdmin;

  $("#logoutButton").hidden = !signedIn;
  $("#authForm").hidden = signedIn;

  if (signedIn) {
    $("#authMessage").textContent =
      `เข้าสู่ระบบแล้ว: ${state.user.name} ` +
      `(${isAdmin ? "แอดมิน" : "สมาชิก"})`;
  } else {
    $("#authMessage").textContent = "";
  }
}
function setAuthMode(mode) {
  state.authMode = mode;
  $("#loginTab").classList.toggle("active", mode === "login");
  $("#registerTab").classList.toggle("active", mode === "register");
  $("#nameLabel").hidden = mode !== "register";
  $("#authName").required = mode === "register";
  $("#authSubmit").textContent = mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
  $("#authPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("#authMessage").textContent = "";
}
async function submitAuth(form) {
  const payload = { email: $("#authEmail").value, password: $("#authPassword").value };
  if (state.authMode === "register") payload.name = $("#authName").value;
  try {
    const result = await api(`/auth/${state.authMode === "login" ? "login" : "register"}`, { method:"POST", body:JSON.stringify(payload) });
    state.token = result.token; state.user = result.user;
    localStorage.setItem("bluevita-token", state.token); localStorage.setItem("bluevita-user", JSON.stringify(state.user));
    form.reset(); updateAccountUI(); toast("เข้าสู่ระบบสำเร็จ"); showView("home");
  } catch (e) { $("#authMessage").textContent = e.message; }
}
function logout() {
  state.token = ""; state.user = null;
  localStorage.removeItem("bluevita-token"); localStorage.removeItem("bluevita-user");
  updateAccountUI(); toast("ออกจากระบบแล้ว"); showView("home");
}
async function renderOrders() {
  if (!state.user) { $("#ordersContent").innerHTML = '<div class="empty-state"><h3>เข้าสู่ระบบเพื่อดูคำสั่งซื้อ</h3><button class="button button-primary" data-view="account">เข้าสู่ระบบ</button></div>'; return; }
  try {
    const orders = await api("/orders/mine");
    $("#ordersContent").innerHTML = orders.length ? orders.map(o => `<article class="order-card"><div class="order-head"><b>${escapeHtml(o.id)}</b><span class="status-pill">${escapeHtml(o.status)}</span></div><p>${new Date(o.createdAt).toLocaleString("th-TH")} · ${o.items.map(i => `${escapeHtml(i.name)} × ${i.quantity}`).join(", ")}</p><b>ยอดรวม ${money(o.total)}</b></article>`).join("") : '<div class="empty-state"><h3>ยังไม่มีคำสั่งซื้อ</h3><p>เมื่อคุณสั่งซื้อ รายการจะแสดงที่หน้านี้</p><button class="button button-primary" data-view="shop">เลือกชมสินค้า</button></div>';
  } catch (e) { $("#ordersContent").innerHTML = `<div class="empty-state">${escapeHtml(e.message)}</div>`; }
}
async function renderAdmin() {
  if (state.user?.role !== "admin") return showView("account");
  $("#adminProducts").innerHTML = state.products.map(p => `<div class="admin-item"><div><b>${escapeHtml(p.name)}</b><small>${money(p.price)} · คงเหลือ ${p.stock}</small></div><button class="danger-button" data-delete-product="${p.id}">ลบ</button></div>`).join("");
  try {
    const orders = await api("/admin/orders");
    $("#adminOrders").innerHTML = orders.length ? orders.map(o => `<div class="admin-order"><b>${escapeHtml(o.id)}</b> · ${money(o.total)}<small>${escapeHtml(o.shippingName)} · ${escapeHtml(o.phone)}</small><select data-order-status="${o.id}">${["รอดำเนินการ","กำลังจัดส่ง","จัดส่งแล้ว","ยกเลิก"].map(s => `<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></div>`).join("") : "<p>ยังไม่มีคำสั่งซื้อ</p>";
  } catch (e) { $("#adminOrders").innerHTML = `<p>${escapeHtml(e.message)}</p>`; }
}
document.addEventListener("click", async event => {
  const view = event.target.closest("[data-view]")?.dataset.view;
  if (view) { event.preventDefault(); showView(view); return; }
  const category = event.target.closest("[data-category]")?.dataset.category;
  if (category) { showView("shop"); $("#categoryFilter").value = category; renderShop(); return; }
  const detail = event.target.closest("[data-detail]")?.dataset.detail; if (detail) { state.currentProduct = detail; showView("detail"); return; }
  const add = event.target.closest("[data-add]")?.dataset.add; if (add) return addToCart(add);
  const qty = event.target.closest("[data-qty]");
  if (qty) {
    const item = state.cart.find(i => i.id === qty.dataset.qty); const product = state.products.find(p => p.id === qty.dataset.qty);
    if (item && product) { item.quantity += Number(qty.dataset.delta); if (item.quantity <= 0) state.cart = state.cart.filter(i => i.id !== item.id); if (item.quantity > product.stock) item.quantity = product.stock; saveCart(); renderCart(); }
    return;
  }
  const remove = event.target.closest("[data-remove]")?.dataset.remove;
  if (remove) { state.cart = state.cart.filter(i => i.id !== remove); saveCart(); renderCart(); return; }
  const del = event.target.closest("[data-delete-product]")?.dataset.deleteProduct;
  if (del && confirm("ต้องการลบสินค้านี้หรือไม่?")) {
    try { await api(`/admin/products/${del}`, { method:"DELETE" }); await loadProducts(); renderAdmin(); toast("ลบสินค้าแล้ว"); } catch(e) { toast(e.message); }
  }
});
document.addEventListener("change", async event => {
  if (event.target.matches("#searchInput,#categoryFilter,#sortFilter")) renderShop();
  const orderId = event.target.dataset.orderStatus;
  if (orderId) {
    try { await api(`/admin/orders/${orderId}`, { method:"PATCH", body:JSON.stringify({ status:event.target.value }) }); toast("อัปเดตสถานะแล้ว"); }
    catch(e) { toast(e.message); }
  }
});
// ============================================
// BLUEVITA DASHBOARD RENDERER
// ============================================

async function renderDashboard() {
  const message = $("#dashboardMessage");
  const content = $("#dashboardContent");

  if (state.user?.role !== "admin") {
    showView("account");
    return;
  }

  message.hidden = false;
  message.textContent = "กำลังโหลดข้อมูล...";
  content.hidden = true;

  try {
    // ดึงข้อมูลจาก API ที่ตรวจสอบสิทธิ์แอดมิน
    const data = await api("/admin/dashboard");

    $("#dashSales").textContent = money(data.totalSales);
    $("#dashOrders").textContent =
      Number(data.totalOrders || 0).toLocaleString("th-TH");

    $("#dashItems").textContent =
      Number(data.totalItemsSold || 0).toLocaleString("th-TH");

    $("#dashMembers").textContent =
      Number(data.totalMembers || 0).toLocaleString("th-TH");

    // สรุปสถานะคำสั่งซื้อ
    const statuses = Object.entries(data.statusSummary || {});

    $("#dashStatuses").innerHTML = statuses.length
      ? statuses.map(([status, count]) => `
          <div class="dashboard-list-row">
            <span>${escapeHtml(status)}</span>
            <strong>${Number(count).toLocaleString("th-TH")} รายการ</strong>
          </div>
        `).join("")
      : '<p class="dashboard-empty">ยังไม่มีคำสั่งซื้อ</p>';

    // สินค้าขายดี
    const topProducts = data.topProducts || [];

    $("#dashTopProducts").innerHTML = topProducts.length
      ? topProducts.map((product, index) => `
          <div class="dashboard-list-row">
            <span>
              <b>${index + 1}.</b>
              ${escapeHtml(product.name)}
            </span>
            <strong>${Number(product.quantity).toLocaleString("th-TH")} ชิ้น</strong>
          </div>
        `).join("")
      : '<p class="dashboard-empty">ยังไม่มีข้อมูลสินค้าที่ขายได้</p>';

    // วาดกราฟยอดขายรายเดือน
    drawSalesChart(data.monthlySales || []);

    message.hidden = true;
    content.hidden = false;

  } catch (error) {
    message.hidden = false;
    content.hidden = true;

    message.innerHTML = `
      <strong>โหลด Dashboard ไม่สำเร็จ</strong>
      <p>${escapeHtml(error.message)}</p>
      <p>ตรวจสอบการเข้าสู่ระบบและการเชื่อมต่อเซิร์ฟเวอร์</p>
    `;
  }
}


// วาดกราฟด้วย Canvas ไม่ต้องติดตั้ง Chart.js
function drawSalesChart(monthlySales) {
  const canvas = $("#salesChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();

  const width = Math.max(rect.width, 280);
  const height = 300;
  const ratio = window.devicePixelRatio || 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.height = `${height}px`;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const values = monthlySales.map(item =>
    Number(item.sales || 0)
  );

  const maxValue = Math.max(...values, 1);

  const padding = {
    top: 20,
    right: 15,
    bottom: 55,
    left: 65
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // เส้นกริดและตัวเลขแกน Y
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartHeight * i / 4;
    const value = maxValue * (4 - i) / 4;

    ctx.beginPath();
    ctx.strokeStyle = "#e5eef7";
    ctx.lineWidth = 1;
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = "#6b8298";
    ctx.fillText(
      value.toLocaleString("th-TH", {
        maximumFractionDigits: 0
      }),
      padding.left - 8,
      y
    );
  }

  if (!monthlySales.length) {
    ctx.fillStyle = "#6b8298";
    ctx.textAlign = "center";
    ctx.fillText("ไม่มีข้อมูล", width / 2, height / 2);
    return;
  }

  const step = chartWidth / monthlySales.length;
  const barWidth = Math.min(26, step * 0.58);

  monthlySales.forEach((item, index) => {
    const value = Number(item.sales || 0);
    const barHeight = value / maxValue * chartHeight;

    const x =
      padding.left + index * step + (step - barWidth) / 2;

    const y = padding.top + chartHeight - barHeight;

    // แท่งกราฟ
    ctx.fillStyle = "#2388df";
    ctx.beginPath();

    const radius = Math.min(5, barWidth / 2);

    ctx.roundRect(
      x,
      y,
      barWidth,
      Math.max(barHeight, 1),
      radius
    );

    ctx.fill();

    // ป้ายเดือน
    const parts = String(item.month).split("-");
    const label = parts.length === 2
      ? `${parts[1]}/${parts[0].slice(-2)}`
      : String(item.month);

    ctx.fillStyle = "#607b94";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText(
      label,
      padding.left + index * step + step / 2,
      height - padding.bottom + 18
    );
  });
}


// ปุ่มโหลดข้อมูลใหม่
$("#refreshDashboard")?.addEventListener("click", () => {
  renderDashboard();
});
document.addEventListener("submit", async event => {
  if (event.target.id === "authForm") { event.preventDefault(); await submitAuth(event.target); }
  if (event.target.matches(".review-form")) {
    event.preventDefault();
    const form = event.target, fd = new FormData(form);
    try { await api("/reviews", { method:"POST", body:JSON.stringify({ orderId:form.dataset.reviewOrder, productId:form.dataset.reviewProduct, rating:Number(fd.get("rating")), comment:fd.get("comment") }) }); toast("ส่งรีวิวสำเร็จ! ได้รับ 1 คะแนน 🎉"); await renderRewards(); }
    catch(e) { toast(e.message); }
  }
  if (event.target.id === "checkoutForm") { event.preventDefault(); await checkout(event.target); }
  if (event.target.id === "productForm") {
    event.preventDefault();
    const fd = new FormData(event.target);
    const product = Object.fromEntries(fd.entries()); product.featured = fd.has("featured");
    try { await api("/admin/products", { method:"POST", body:JSON.stringify(product) }); event.target.reset(); $("#productMessage").textContent = "เพิ่มสินค้าแล้ว"; await loadProducts(); renderAdmin(); toast("เพิ่มสินค้าแล้ว"); }
    catch(e) { $("#productMessage").textContent = e.message; }
  }
});
$("#loginTab").addEventListener("click", () => setAuthMode("login"));
$("#registerTab").addEventListener("click", () => setAuthMode("register"));
$("#logoutButton").addEventListener("click", logout);
$("#searchInput").addEventListener("input", renderShop);
(async function init() {
  updateCartCount(); updateAccountUI(); setAuthMode("login");
  try {
    if (state.token) {
      const result = await api("/auth/me"); state.user = result.user; localStorage.setItem("bluevita-user", JSON.stringify(state.user));
    }
  } catch { state.token = ""; state.user = null; localStorage.removeItem("bluevita-token"); localStorage.removeItem("bluevita-user"); }
  try { await loadProducts(); } catch (e) { $("#featuredProducts").innerHTML = `<div class="empty-state">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ${escapeHtml(e.message)}</div>`; }
  updateAccountUI();
})();
