let monthlySalesChart = null;
let topProductsChart = null;
let orderStatusChart = null;

async function loadAdminDashboard() {
  const token = localStorage.getItem("bluevita-token");

  if (!token) {
    showDashboardError("กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินก่อน");
    return;
  }

  try {
    const response = await fetch("/api/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "ไม่สามารถโหลดข้อมูล Dashboard ได้");
    }

    const money = value =>
      new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 2
      }).format(Number(value) || 0);

    document.getElementById("dashSales").textContent =
      money(data.summary.totalSales);

    document.getElementById("dashOrders").textContent =
      Number(data.summary.totalOrders || 0).toLocaleString("th-TH");

    document.getElementById("dashItems").textContent =
      Number(data.summary.totalItemsSold || 0).toLocaleString("th-TH");

    document.getElementById("dashMembers").textContent =
      Number(data.summary.totalMembers || 0).toLocaleString("th-TH");

    if (typeof Chart === "undefined") {
      throw new Error("โหลด Chart.js ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
    }

    const monthlyCanvas = document.getElementById("monthlySalesChart");
    const productsCanvas = document.getElementById("topProductsChart");
    const statusCanvas = document.getElementById("orderStatusChart");

    if (!monthlyCanvas || !productsCanvas || !statusCanvas) {
      throw new Error("ไม่พบพื้นที่แสดงกราฟ กรุณาตรวจสอบ index.html");
    }

    if (monthlySalesChart) monthlySalesChart.destroy();
    if (topProductsChart) topProductsChart.destroy();
    if (orderStatusChart) orderStatusChart.destroy();

    monthlySalesChart = new Chart(monthlyCanvas, {
      type: "line",
      data: {
        labels: data.monthlySales.map(item => item.month),
        datasets: [{
          label: "ยอดขาย (บาท)",
          data: data.monthlySales.map(item => item.sales),
          borderColor: "#1677d2",
          backgroundColor: "rgba(22, 119, 210, 0.12)",
          borderWidth: 3,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });

    topProductsChart = new Chart(productsCanvas, {
      type: "bar",
      data: {
        labels: data.topProducts.map(item => item.name),
        datasets: [{
          label: "จำนวนชิ้นที่ขาย",
          data: data.topProducts.map(item => item.quantity),
          backgroundColor: "#68a9ed",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        indexAxis: "y"
      }
    });

    orderStatusChart = new Chart(statusCanvas, {
      type: "doughnut",
      data: {
        labels: Object.keys(data.orderStatuses),
        datasets: [{
          data: Object.values(data.orderStatuses),
          backgroundColor: ["#68a9ed", "#f6c66b", "#68c9a5", "#ef8585"]
        }]
      },
      options: {
        responsive: true
      }
    });

  } catch (error) {
    showDashboardError(error.message);
  }
}

function showDashboardError(message) {
  const dashboard = document.getElementById("adminDashboardMessage");
  if (dashboard) {
    dashboard.textContent = message;
    dashboard.hidden = false;
  } else {
    console.error("BlueVita Dashboard:", message);
  }
}
