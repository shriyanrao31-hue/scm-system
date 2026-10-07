/**
 * Main Single Page Application (SPA) Controller with Dynamic Dashboard Routing
 * Connects REST APIs, Matrix Effects, View Switching, and Telemetry Renderers.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('⚡ SCM Nexus Command Center Booting...');

  const API_BASE = window.SCM_CONFIG?.API_BASE || '';
  
  let inventoryData = [];
  let shipmentsData = [];
  let poData = [];
  let trackerMap = null;
  let chartManager = null;
  let telemetryRadar = null;

  // ==========================================
  // 1. Matrix Background Effect (Home Screen)
  // ==========================================
  const canvas = document.getElementById('matrix-bg');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = [];
  for (let x = 0; x < columns; x++) drops[x] = 1;

  function drawMatrix() {
    ctx.fillStyle = 'rgba(11, 15, 25, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00f3ff';
    ctx.font = fontSize + 'px "Times New Roman", Times, serif';
    
    for (let i = 0; i < drops.length; i++) {
      const text = chars.charAt(Math.floor(Math.random() * chars.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  let matrixInterval = setInterval(drawMatrix, 33);

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // ==========================================
  // 2. View Switching & Authentication
  // ==========================================
  function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
  }

  document.getElementById('btn-enter-system').addEventListener('click', () => {
    switchView('view-login');
  });

  document.getElementById('btn-login-submit').addEventListener('click', async () => {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    
    try {
      const res = await fetch(`${API_BASE}/api/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        clearInterval(matrixInterval); // Save CPU once logged in
        switchView('view-app');
        initApp();
      } else {
        document.getElementById('login-error').style.display = 'block';
      }
    } catch (e) {
      console.warn("Auth failed, falling back to instant bypass for local mode.");
      clearInterval(matrixInterval);
      switchView('view-app');
      initApp();
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    location.reload();
  });

  // ==========================================
  // 3. Dynamic Multi-Dashboard Navigation
  // ==========================================
  document.querySelectorAll('.nav-item[data-target]').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const targetId = e.currentTarget.getAttribute('data-target');
      document.querySelectorAll('.dash-section').forEach(d => d.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');

      // Crucial: Leaflet maps glitch if resized while hidden
      if (targetId === 'dash-gis' && trackerMap && trackerMap.map) {
        setTimeout(() => trackerMap.map.invalidateSize(), 100);
      }
    });
  });

  // ==========================================
  // 4. Application Initialization
  // ==========================================
  function initApp() {
    startHudClock();
    
    const strategicWarehouses = [
      { code: 'ORD-01', name: 'Chicago Apex Hub', city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073 },
      { code: 'DFW-02', name: 'Dallas SuperCenter', city: 'Dallas', country: 'USA', lat: 32.8998, lng: -97.0403 },
      { code: 'LAX-03', name: 'Ontario Depot', city: 'Ontario', country: 'USA', lat: 34.0537, lng: -117.5982 },
      { code: 'EWR-04', name: 'Newark Port Mega-Facility', city: 'Newark', country: 'USA', lat: 40.6895, lng: -74.1745 }
    ];

    try {
      trackerMap = new FleetTrackerMap('gis-map');
      trackerMap.plotWarehouses(strategicWarehouses);
    } catch (e) { console.error('Map init failed:', e); }

    try {
      chartManager = new InventoryTelemetryCharts();
    } catch (e) { console.error('Charts init failed:', e); }

    telemetryRadar = new TelemetryRadar();

    telemetryRadar.on('telemetry:update', (telemetry) => {
      if (trackerMap) trackerMap.handleLiveTelemetry(telemetry);
      logEventFeed(`GPS [${telemetry.tracking_number}]: Lat ${telemetry.lat}, Lng ${telemetry.lng} @ ${telemetry.speed} mph`);
    });

    telemetryRadar.on('inventory:alert', (alert) => {
      logEventFeed(`STOCK BREACH: ${alert.sku} @ ${alert.warehouse_code} dropped to ${alert.current_qty} units!`, true);
      fetchInventory();
    });

    telemetryRadar.on('po:status_change', (poEvent) => {
      logEventFeed(`PO UPDATE: ${poEvent.po_number} -> ${poEvent.new_status || poEvent.status}`);
      fetchPurchaseOrders();
    });

    fetchInventory();
    fetchShipments();
    fetchPurchaseOrders();
    logEventFeed('Nexus Command Center successfully initialized.');
  }

  // ==========================================
  // 5. Data Fetching & Rendering
  // ==========================================
  function startHudClock() {
    const clockEl = document.getElementById('hud-live-clock');
    setInterval(() => { if (clockEl) clockEl.innerText = new Date().toUTCString().replace('GMT', 'UTC'); }, 1000);
  }

  async function fetchInventory() {
    try {
      const res = await fetch(`${API_BASE}/api/inventory.php?action=list`);
      const data = await res.json();
      if (data.success) {
        inventoryData = data.inventory;
        renderInventoryTable(inventoryData);
        if (chartManager) chartManager.updateStockMetrics(inventoryData);
        updateInventoryCounters(inventoryData);
      }
    } catch (err) {}
  }

  async function fetchShipments() {
    try {
      const res = await fetch(`${API_BASE}/api/shipments.php?action=active`);
      const data = await res.json();
      if (data.success) {
        shipmentsData = data.shipments;
        if (trackerMap) trackerMap.loadInitialShipments(shipmentsData);
        document.getElementById('stat-active-trucks').innerText = shipmentsData.length;
      }
    } catch (err) {}
  }

  async function fetchPurchaseOrders() {
    try {
      const res = await fetch(`${API_BASE}/api/purchase_orders.php?action=list`);
      const data = await res.json();
      if (data.success) {
        poData = data.orders;
        renderKanbanBoard(data.kanban);
        updatePoCounters(poData);
      }
    } catch (err) {}
  }

  function renderInventoryTable(items) {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Update Modal Dropdown as well
    const skuSelect = document.getElementById('restock-sku');
    if (skuSelect) {
      skuSelect.innerHTML = items.map(i => `<option value="${i.warehouse_code}">[${i.warehouse_code}] ${i.sku} - ${i.product_name}</option>`).join('');
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      let badgeClass = 'badge-optimal';
      if (item.stock_status === 'LOW_STOCK') badgeClass = 'badge-low';
      if (item.stock_status === 'CRITICAL_REORDER' || item.stock_status === 'OUT_OF_STOCK') badgeClass = 'badge-critical';
      tr.innerHTML = `
        <td style="font-weight: bold; color: var(--accent-cyan);">${item.sku}</td>
        <td>${item.product_name}</td>
        <td>${item.warehouse_code}</td>
        <td style="font-weight: bold;">${item.quantity_on_hand}</td>
        <td style="color: var(--accent-amber);">${item.reorder_point}</td>
        <td style="color: var(--accent-emerald);">${item.economic_order_qty}</td>
        <td><span class="badge ${badgeClass}">${item.stock_status}</span></td>
        <td style="display: flex; gap: 8px;">
          <button class="hud-btn btn-restock" data-wh="${item.warehouse_code}" data-sku="${item.sku}">🛒 Restock</button>
          <button class="hud-btn hud-btn-danger btn-deduct" data-pid="${item.product_id}" data-wid="${item.warehouse_id}">⚡ Deduct</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-deduct').forEach(btn => {
      btn.addEventListener('click', (e) => simulateStockDeduction(e.target.dataset.pid, e.target.dataset.wid, 25));
    });
    document.querySelectorAll('.btn-restock').forEach(btn => {
      btn.addEventListener('click', (e) => openRestockModal(e.target.dataset.wh, e.target.dataset.sku));
    });
  }

  function renderKanbanBoard(kanban) {
    const columns = ['Draft', 'Issued', 'In Transit', 'Received'];
    columns.forEach(col => {
      const colContainer = document.getElementById(`kanban-cards-${col.toLowerCase().replace(' ', '-')}`);
      if (!colContainer) return;
      colContainer.innerHTML = '';
      const orders = kanban[col] || [];
      document.getElementById(`kanban-count-${col.toLowerCase().replace(' ', '-')}`).innerText = orders.length;

      orders.forEach(po => {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
            <span class="po-number-title">${po.po_number}</span>
            <span class="hud-badge">${po.trigger_type === 'AUTOMATED_ROP' ? 'AUTO ROP' : 'MANUAL'}</span>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 6px;">${po.supplier_name} → ${po.warehouse_code}</div>
          <div style="display:flex; justify-content:space-between; font-size: 0.9rem; color: var(--text-muted);">
            <span>Items: ${po.item_count || 1}</span>
            <span style="color: var(--accent-cyan); font-weight: bold;">$${Number(po.total_amount).toLocaleString()}</span>
          </div>
        `;
        card.addEventListener('click', () => advancePoStatusPrompt(po));
        colContainer.appendChild(card);
      });
    });
  }

  async function simulateStockDeduction(productId, warehouseId, qty = 25) {
    try {
      logEventFeed(`Deducting ${qty} units from Product #${productId}...`);
      const res = await fetch(`${API_BASE}/api/inventory.php?action=deduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, warehouse_id: warehouseId, quantity: qty })
      });
      const result = await res.json();
      if (result.success) {
        logEventFeed(`Stock deducted: New Qty: ${result.inventory.new_quantity} [${result.inventory.stock_status}]`);
        if (result.automated_po) {
          logEventFeed(`🚨 ROP TRIGGER: PO Created ${result.automated_po.po_number} for $${result.automated_po.total_amount}!`, true);
        }
        fetchInventory();
        fetchPurchaseOrders();
      }
    } catch (err) {}
  }

  async function advancePoStatusPrompt(po) {
    const nextStates = { 'Draft': 'Issued', 'Issued': 'In Transit', 'In Transit': 'Received', 'Received': null };
    const next = nextStates[po.status];
    if (!next) { alert(`PO ${po.po_number} is closed.`); return; }
    if (confirm(`Advance Purchase Order ${po.po_number} to "${next}"?`)) {
      try {
        const res = await fetch(`${API_BASE}/api/purchase_orders.php?action=update_status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: po.id, status: next })
        });
        const resp = await res.json();
        if (resp.success) {
          logEventFeed(`PO Status Changed: ${po.po_number} -> ${next}`);
          fetchPurchaseOrders();
        }
      } catch (e) {}
    }
  }

  function updateInventoryCounters(items) {
    document.getElementById('stat-critical-skus').innerText = items.filter(i => i.stock_status === 'CRITICAL_REORDER' || i.stock_status === 'OUT_OF_STOCK').length;
    document.getElementById('stat-inventory-val').innerText = `$${(items.reduce((acc, curr) => acc + (curr.quantity_on_hand * (curr.unit_price || 25)), 0) / 1000).toFixed(1)}k`;
  }
  function updatePoCounters(orders) {
    document.getElementById('stat-active-pos').innerText = orders.filter(p => ['Draft','Issued','In Transit'].includes(p.status)).length;
  }

  function logEventFeed(message, isAlert = false) {
    const feed = document.getElementById('hud-event-feed');
    if (!feed) return;
    const entry = document.createElement('div');
    entry.className = `event-entry ${isAlert ? 'alert-danger' : ''}`;
    entry.innerHTML = `<span class="event-time">[${new Date().toTimeString().split(' ')[0]}]</span> <span>${message}</span>`;
    feed.prepend(entry);
    if (feed.children.length > 100) feed.removeChild(feed.lastChild);
  }

  document.getElementById('btn-quick-deduct')?.addEventListener('click', () => {
    if (inventoryData.length > 0) simulateStockDeduction(inventoryData[0].product_id, inventoryData[0].warehouse_id, 30);
  });

  // ==========================================
  // 6. Modal & User Input Logic
  // ==========================================
  const modalRestock = document.getElementById('modal-restock');
  
  function openRestockModal(warehouseCode = null, sku = null) {
    if (warehouseCode && document.getElementById('restock-sku')) {
      document.getElementById('restock-sku').value = warehouseCode;
    }
    modalRestock.classList.add('active');
  }

  document.getElementById('btn-cancel-restock')?.addEventListener('click', () => {
    modalRestock.classList.remove('active');
  });

  document.getElementById('btn-submit-restock')?.addEventListener('click', async () => {
    const whCode = document.getElementById('restock-sku').value;
    const qty = document.getElementById('restock-qty').value;

    try {
      const res = await fetch(`${API_BASE}/api/purchase_orders.php?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_code: whCode, quantity: parseInt(qty) })
      });
      const data = await res.json();
      if (data.success) {
        logEventFeed(`🛒 Manual PO Placed: ${data.order.po_number} for ${qty} units to ${whCode}`);
        modalRestock.classList.remove('active');
        fetchPurchaseOrders(); // Refresh Kanban board
        
        // Switch to Procurement Dashboard to show the new order
        document.querySelector('.nav-item[data-target="dash-procurement"]').click();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to place manual order.');
    }
  });

});
