<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
async function loadAdminDashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("กรุณาเข้าสู่ระบบแอดมิน");
    return;
  }

  const response = await fetch("/api/admin/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    alert("ไม่สามารถเข้าถึง Dashboard ได้ กรุณาตรวจสอบสิทธิ์แอดมิน");
    return;
  }

  const data = await response.json();

  const money = value =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 2
    }).format(value);

  document.getElementById("dashSales").textContent =
    money(data.summary.totalSales);

  document.getElementById("dashOrders").textContent =
    data.summary.totalOrders.toLocaleString("th-TH");

  document.getElementById("dashItems").textContent =
    data.summary.totalItemsSold.toLocaleString("th-TH");

  document.getElementById("dashMembers").textContent =
    data.summary.totalMembers.toLocaleString("th-TH");

  new Chart(document.getElementById("monthlySalesChart"), {
    type: "line",
    data: {
      labels: data.monthlySales.map(item => item.month),
      datasets: [{
        label: "ยอดขาย (บาท)",
        data: data.monthlySales.map(item => item.sales),
        borderWidth: 3,
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });

  new Chart(document.getElementById("topProductsChart"), {
    type: "bar",
    data: {
      labels: data.topProducts.map(item => item.name),
      datasets: [{
        label: "จำนวนชิ้นที่ขาย",
        data: data.topProducts.map(item => item.quantity)
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y"
    }
  });

  new Chart(document.getElementById("orderStatusChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(data.orderStatuses),
      datasets: [{
        label: "จำนวนคำสั่งซื้อ",
        data: Object.values(data.orderStatuses)
      }]
    },
    options: {
      responsive: true
    }
  });
}
</script>
