/**
 * Chart.js Dark HUD Telemetry & Stock Metrics Renderer
 * Renders animated stock vs ROP threshold charts, category distributions, and real-time trends.
 */

class InventoryTelemetryCharts {
  constructor() {
    this.stockChart = null;
    this.statusDonutChart = null;
    this.initCharts();
  }

  initCharts() {
    const stockCanvas = document.getElementById('stockAnalysisChart');
    const statusCanvas = document.getElementById('inventoryStatusDonut');

    if (!stockCanvas || typeof Chart === 'undefined') return;

    // Set global Chart.js dark-mode defaults
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'JetBrains Mono', monospace";
    Chart.defaults.font.size = 11;

    // 1. Bar Chart: On-Hand Stock vs Reorder Point (ROP) Thresholds
    this.stockChart = new Chart(stockCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Current Stock',
            data: [],
            backgroundColor: 'rgba(0, 243, 255, 0.65)',
            borderColor: '#00f3ff',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Reorder Point (ROP)',
            data: [],
            type: 'line',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#ef4444',
            pointRadius: 3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { maxRotation: 45, minRotation: 0 }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, padding: 15 }
          },
          tooltip: {
            backgroundColor: 'rgba(11, 15, 25, 0.95)',
            borderColor: 'rgba(0, 243, 255, 0.3)',
            borderWidth: 1,
            padding: 10
          }
        }
      }
    });

    // 2. Donut Chart: Inventory Health Distribution
    if (statusCanvas) {
      this.statusDonutChart = new Chart(statusCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Optimal', 'Low Stock', 'Critical Reorder', 'Out of Stock'],
          datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: [
              '#10b981', // Emerald
              '#f59e0b', // Amber
              '#ef4444', // Crimson
              '#64748b'  // Muted Grey
            ],
            borderColor: '#0b0f19',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'right',
              labels: { boxWidth: 10, padding: 12 }
            }
          }
        }
      });
    }
  }

  // Update Stock & ROP chart with top 10 most critical/active SKUs
  updateStockMetrics(inventoryItems) {
    if (!this.stockChart || !inventoryItems.length) return;

    // Sort by most vulnerable (lowest ratio of current stock to ROP)
    const sorted = [...inventoryItems].sort((a, b) => 
      (a.quantity_on_hand / Math.max(1, a.reorder_point)) - (b.quantity_on_hand / Math.max(1, b.reorder_point))
    ).slice(0, 10);

    const labels = sorted.map(i => i.sku || i.product_name?.substring(0, 14));
    const stockValues = sorted.map(i => i.quantity_on_hand);
    const ropValues = sorted.map(i => i.reorder_point);

    this.stockChart.data.labels = labels;
    this.stockChart.data.datasets[0].data = stockValues;
    this.stockChart.data.datasets[1].data = ropValues;

    // Change bar color dynamically if critical
    this.stockChart.data.datasets[0].backgroundColor = sorted.map(i => 
      i.quantity_on_hand <= i.reorder_point ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0, 243, 255, 0.65)'
    );

    this.stockChart.update('active');

    // Update Donut Chart
    if (this.statusDonutChart) {
      let optimal = 0, low = 0, critical = 0, out = 0;
      inventoryItems.forEach(i => {
        if (i.stock_status === 'OPTIMAL') optimal++;
        else if (i.stock_status === 'LOW_STOCK') low++;
        else if (i.stock_status === 'CRITICAL_REORDER') critical++;
        else out++;
      });

      this.statusDonutChart.data.datasets[0].data = [optimal, low, critical, out];
      this.statusDonutChart.update('active');
    }
  }
}

window.InventoryTelemetryCharts = InventoryTelemetryCharts;
