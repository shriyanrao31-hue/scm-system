/**
 * SCM Command Center - Synthetic Data Generator Suite
 * Generates realistic enterprise-scale synthetic dataset (suppliers, warehouses, products,
 * inventory, purchase orders, shipments, route geometries, and telemetry records).
 * 
 * Usage:
 *   node database/generate_synthetic_data.js [--output database/seed_synthetic.sql]
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'seed_synthetic.sql');

console.log('⚡ Initializing Synthetic SCM Data Generation Suite...');

// Helper random functions
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Linear interpolation between two coordinates
function interpolateWaypoints(lat1, lon1, lat2, lon2, steps = 15) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Add small organic jitter to simulate actual highway paths
    const jitterLat = (Math.random() - 0.5) * 0.08;
    const jitterLon = (Math.random() - 0.5) * 0.08;
    const lat = parseFloat((lat1 + (lat2 - lat1) * t + (i > 0 && i < steps ? jitterLat : 0)).toFixed(6));
    const lon = parseFloat((lon1 + (lon2 - lon1) * t + (i > 0 && i < steps ? jitterLon : 0)).toFixed(6));
    points.push([lat, lon]);
  }
  return points;
}

// 1. Users
const users = [
  { username: 'admin', email: 'admin@logistics-hq.io', role: 'admin', hash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' }, // password: password
  { username: 'dispatcher_eva', email: 'dispatcher@logistics-hq.io', role: 'dispatcher', hash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
  { username: 'procurement_lead', email: 'procurement@logistics-hq.io', role: 'procurement', hash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
  { username: 'ops_viewer', email: 'viewer@logistics-hq.io', role: 'viewer', hash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' }
];

// 2. Warehouses (Major Strategic Logistics Hubs across USA / North America)
const warehouses = [
  { name: 'Chicago Apex Hub (ORD-01)', code: 'WH-ORD-01', address: '1050 Logistics Pkwy', city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073, capacity: 120000 },
  { name: 'Dallas Fort Worth SuperCenter', code: 'WH-DFW-02', address: '4400 Air Cargo Way', city: 'Dallas', country: 'USA', lat: 32.8998, lng: -97.0403, capacity: 185000 },
  { name: 'Ontario Inland Logistics Depot', code: 'WH-LAX-03', address: '2200 Haven Ave', city: 'Ontario', country: 'USA', lat: 34.0537, lng: -117.5982, capacity: 250000 },
  { name: 'Newark Port Mega-Facility', code: 'WH-EWR-04', address: '800 Port St', city: 'Newark', country: 'USA', lat: 40.6895, lng: -74.1745, capacity: 160000 },
  { name: 'Atlanta Gateway Fulfillment', code: 'WH-ATL-05', address: '3300 South Fulton Pkwy', city: 'Atlanta', country: 'USA', lat: 33.6407, lng: -84.4277, capacity: 140000 },
  { name: 'Seattle North Intermodal Hub', code: 'WH-SEA-06', address: '17800 International Blvd', city: 'Seattle', country: 'USA', lat: 47.4502, lng: -122.3088, capacity: 110000 },
  { name: 'Denver Rockies Depot', code: 'WH-DEN-07', address: '8500 Pena Blvd', city: 'Denver', country: 'USA', lat: 39.8561, lng: -104.6737, capacity: 95000 },
  { name: 'Memphis Mid-South CrossDock', code: 'WH-MEM-08', address: '2900 Democrat Rd', city: 'Memphis', country: 'USA', lat: 35.0424, lng: -89.9767, capacity: 175000 }
];

// 3. Suppliers (20+ global component manufacturers & suppliers)
const supplierNames = [
  ['Apex Micro Silicon', 'SUP-APEX', 'Austin', 'USA', 5, 98.5],
  ['Kyoto Optics Corp', 'SUP-KYOTO', 'Kyoto', 'Japan', 12, 99.1],
  ['Shenzhen HighTech Sensor Tech', 'SUP-SZSN', 'Shenzhen', 'China', 14, 94.2],
  ['Bavaria Precision Hydraulics', 'SUP-BPH', 'Munich', 'Germany', 9, 97.8],
  ['Nordic Telemetry Systems', 'SUP-NTS', 'Stockholm', 'Sweden', 6, 99.4],
  ['Silicon Valley Photonics', 'SUP-SVP', 'San Jose', 'USA', 4, 96.5],
  ['Taiwan Semi-Packaging Inc', 'SUP-TSPI', 'Hsinchu', 'Taiwan', 10, 98.9],
  ['Seoul Lithium Battery Dynamic', 'SUP-SLBD', 'Seoul', 'South Korea', 11, 95.7],
  ['Zurich Actuator Systems', 'SUP-ZAS', 'Zurich', 'Switzerland', 8, 99.0],
  ['Detroit Fastener & Alloy', 'SUP-DFA', 'Detroit', 'USA', 3, 93.8],
  ['Guildford Quantum Relay Ltd', 'SUP-GQRL', 'Guildford', 'UK', 7, 96.2],
  ['Osaka Display Panels Ltd', 'SUP-ODPL', 'Osaka', 'Japan', 13, 98.0],
  ['Guadalajara Harness Assembly', 'SUP-GHA', 'Guadalajara', 'Mexico', 5, 94.6],
  ['Montreal Aero Composite Labs', 'SUP-MACL', 'Montreal', 'Canada', 6, 97.2],
  ['Singapore Global Marine Supplies', 'SUP-SGMS', 'Singapore', 'Singapore', 15, 96.0],
  ['Helsinki Solid State Dynamics', 'SUP-HSSD', 'Helsinki', 'Finland', 8, 98.8],
  ['Bangalore Circuit Fab Ltd', 'SUP-BCFL', 'Bangalore', 'India', 12, 92.5],
  ['Rotterdam Heavy Logistics Hardware', 'SUP-RHLH', 'Rotterdam', 'Netherlands', 9, 97.4],
  ['Vancouver Smart Fleet Systems', 'SUP-VSFS', 'Vancouver', 'Canada', 4, 98.1],
  ['Phoenix Thermal Management Tech', 'SUP-PTMT', 'Phoenix', 'USA', 3, 99.2],
  ['Busan Electric Motor Works', 'SUP-BEMW', 'Busan', 'South Korea', 10, 96.8],
  ['Dublin Autonomous Sensor Guild', 'SUP-DASG', 'Dublin', 'Ireland', 7, 98.7]
];

// 4. Products Categories & Names Generator (100+ realistic high-tech SKUs)
const categories = ['Avionics', 'Semiconductors', 'Optics & LIDAR', 'Lithium Storage', 'Robotic Actuators', 'RF & Telemetry', 'Heavy Hardware'];
const productNouns = [
  ['ARM-M4 High-Precision MCU', 'Semiconductors', 14.50, 45.0, 35.0],
  ['FPGA Vision Accelerator Board', 'Semiconductors', 245.00, 12.0, 75.0],
  ['LiFePO4 Modular 48V Rack Battery', 'Lithium Storage', 890.00, 4.0, 120.0],
  ['Solid-State Solid Lidar 120m', 'Optics & LIDAR', 620.00, 6.5, 90.0],
  ['Dual-Band RTK GPS Rover Unit', 'RF & Telemetry', 185.00, 22.0, 40.0],
  ['Brushless DC Servo Actuator 24V', 'Robotic Actuators', 112.00, 30.0, 50.0],
  ['CAN-Bus Telemetry Gateway v4', 'RF & Telemetry', 95.00, 40.0, 45.0],
  ['Tactical IMU Gyroscope Module', 'Avionics', 430.00, 8.0, 80.0],
  ['Titanium Chassis Bolt M10-Titan', 'Heavy Hardware', 4.80, 250.0, 25.0],
  ['Industrial Optical Fiber Transceiver', 'Optics & LIDAR', 78.00, 60.0, 35.0],
  ['Thermal Imaging Sensor Array 640x512', 'Optics & LIDAR', 540.00, 5.0, 85.0],
  ['BMS Cell Balancer & Monitor 16S', 'Lithium Storage', 64.00, 38.0, 40.0],
  ['Sub-GHz LoRaWAN Node Gateway', 'RF & Telemetry', 135.00, 18.0, 50.0],
  ['High-Torque Planetary Gearbox 10:1', 'Robotic Actuators', 175.00, 15.0, 60.0],
  ['Gallium Nitride 65W Power IC', 'Semiconductors', 9.20, 180.0, 30.0],
  ['Aero-Grade Carbon Fiber Strut 50cm', 'Heavy Hardware', 85.00, 25.0, 45.0],
  ['EtherCAT Real-time I/O Coupler', 'Avionics', 210.00, 14.0, 65.0],
  ['Micro-Coaxial Radar Harness 2m', 'RF & Telemetry', 32.00, 90.0, 30.0],
  ['Cryogenic Thermal Paste Grade-X', 'Heavy Hardware', 18.50, 120.0, 20.0],
  ['Hermetic Pressure Sensor 300PSI', 'Avionics', 145.00, 28.0, 45.0]
];

// Carriers list
const carriers = ['Maersk Global', 'FedEx Freight', 'DHL Express', 'Swift Intermodal', 'JB Hunt Transport', 'XPO Logistics', 'Old Dominion Freight'];

let sql = '';
sql += `-- =====================================================================\n`;
sql += `-- SCM 4K COMMAND CENTER - SYNTHETIC DATA ENGINE SEED (100+ SKUs, 50+ Shipments)\n`;
sql += `-- Generated on ${new Date().toISOString()}\n`;
sql += `-- =====================================================================\n\n`;
sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
sql += `TRUNCATE TABLE telemetry_logs;\n`;
sql += `TRUNCATE TABLE shipments;\n`;
sql += `TRUNCATE TABLE po_items;\n`;
sql += `TRUNCATE TABLE purchase_orders;\n`;
sql += `TRUNCATE TABLE inventory;\n`;
sql += `TRUNCATE TABLE products;\n`;
sql += `TRUNCATE TABLE warehouses;\n`;
sql += `TRUNCATE TABLE suppliers;\n`;
sql += `TRUNCATE TABLE users;\n`;
sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;

// 1. Insert Users
sql += `-- 1. Seed Users\n`;
sql += `INSERT INTO users (id, username, email, password_hash, role) VALUES\n`;
const userValues = users.map((u, i) => `(${i + 1}, '${u.username}', '${u.email}', '${u.hash}', '${u.role}')`).join(',\n');
sql += userValues + ';\n\n';

// 2. Insert Warehouses
sql += `-- 2. Seed Warehouses\n`;
sql += `INSERT INTO warehouses (id, name, code, address, city, country, latitude, longitude, capacity_sqft) VALUES\n`;
const whValues = warehouses.map((w, i) => 
  `(${i + 1}, '${w.name}', '${w.code}', '${w.address}', '${w.city}', '${w.country}', ${w.lat}, ${w.lng}, ${w.capacity})`
).join(',\n');
sql += whValues + ';\n\n';

// 3. Insert Suppliers
sql += `-- 3. Seed Suppliers\n`;
sql += `INSERT INTO suppliers (id, name, code, contact_email, contact_phone, country, city, lead_time_days, reliability_score) VALUES\n`;
const supValues = supplierNames.map((s, i) => {
  const email = `contact@${s[1].toLowerCase()}.com`;
  const phone = `+1-800-${randInt(100, 999)}-${randInt(1000, 9999)}`;
  return `(${i + 1}, '${s[0]}', '${s[1]}', '${email}', '${phone}', '${s[3]}', '${s[2]}', ${s[4]}, ${s[5]})`;
}).join(',\n');
sql += supValues + ';\n\n';

// 4. Generate 110 Products & Compute ROP/EOQ
sql += `-- 4. Seed Products (110 High-Tech Components)\n`;
sql += `INSERT INTO products (id, sku, name, category, unit_price, daily_demand_rate, order_cost, holding_cost_rate, safety_stock, supplier_id) VALUES\n`;
const products = [];
let prodId = 1;

for (let i = 0; i < productNouns.length; i++) {
  const base = productNouns[i];
  for (let variant = 1; variant <= 6; variant++) {
    if (prodId > 110) break;
    const supId = randInt(1, supplierNames.length);
    const sku = `SKU-${base[1].substring(0, 3).toUpperCase()}-${String(1000 + prodId).substring(1)}`;
    const variantName = `${base[0]} (Rev ${String.fromCharCode(64 + variant)}.${randInt(1, 4)})`;
    const unitPrice = randFloat(base[2] * 0.85, base[2] * 1.25, 2);
    const dailyDemand = randFloat(base[3] * 0.7, base[3] * 1.3, 2);
    const orderCost = base[4];
    const holdingRate = 0.20; // 20% annual
    const leadTime = supplierNames[supId - 1][4];
    const safetyStock = Math.round(1.65 * Math.sqrt(leadTime) * (dailyDemand * 0.3));

    products.push({
      id: prodId,
      sku,
      name: variantName,
      category: base[1],
      unit_price: unitPrice,
      daily_demand_rate: dailyDemand,
      order_cost: orderCost,
      holding_cost_rate: holdingRate,
      safety_stock: safetyStock,
      supplier_id: supId,
      lead_time: leadTime
    });

    prodId++;
  }
}

const prodSqlValues = products.map(p => 
  `(${p.id}, '${p.sku}', '${p.name.replace(/'/g, "\\'")}', '${p.category}', ${p.unit_price}, ${p.daily_demand_rate}, ${p.order_cost}, ${p.holding_cost_rate}, ${p.safety_stock}, ${p.supplier_id})`
).join(',\n');
sql += prodSqlValues + ';\n\n';

// 5. Seed Inventory across Warehouses with Computed ROP and EOQ
sql += `-- 5. Seed Inventory & Dynamic Reorder Points\n`;
sql += `INSERT INTO inventory (id, product_id, warehouse_id, quantity_on_hand, quantity_reserved, reorder_point, economic_order_qty, stock_status) VALUES\n`;

const inventoryRows = [];
let invId = 1;

products.forEach(p => {
  // Distribute across 3-5 random warehouses
  const numWarehouses = randInt(3, 5);
  const assignedWhs = new Set();
  while (assignedWhs.size < numWarehouses) {
    assignedWhs.add(randInt(1, warehouses.length));
  }

  // Formula Calculations
  // ROP = (daily_demand_rate * lead_time) + safety_stock
  const rop = Math.round((p.daily_demand_rate * p.lead_time) + p.safety_stock);
  // Annual demand = daily_demand_rate * 365
  const annualDemand = p.daily_demand_rate * 365;
  // Unit holding cost = unit_price * holding_cost_rate
  const unitHoldingCost = Math.max(p.unit_price * p.holding_cost_rate, 1.0);
  // EOQ = sqrt((2 * annualDemand * orderCost) / unitHoldingCost)
  const eoq = Math.max(Math.round(Math.sqrt((2 * annualDemand * p.order_cost) / unitHoldingCost)), 25);

  assignedWhs.forEach(whId => {
    // Generate varied stock profiles: 10% critical, 25% low stock, 65% optimal
    const roll = Math.random();
    let qty = 0;
    let status = 'OPTIMAL';

    if (roll < 0.12) {
      qty = randInt(0, Math.floor(rop * 0.6));
      status = qty === 0 ? 'OUT_OF_STOCK' : 'CRITICAL_REORDER';
    } else if (roll < 0.35) {
      qty = randInt(Math.floor(rop * 0.65), rop);
      status = 'LOW_STOCK';
    } else {
      qty = randInt(rop + 20, rop + eoq + 150);
      status = 'OPTIMAL';
    }

    const reserved = randInt(0, Math.floor(qty * 0.25));

    inventoryRows.push({
      id: invId++,
      product_id: p.id,
      warehouse_id: whId,
      quantity_on_hand: qty,
      quantity_reserved: reserved,
      reorder_point: rop,
      economic_order_qty: eoq,
      stock_status: status
    });
  });
});

const invSqlValues = inventoryRows.map(inv => 
  `(${inv.id}, ${inv.product_id}, ${inv.warehouse_id}, ${inv.quantity_on_hand}, ${inv.quantity_reserved}, ${inv.reorder_point}, ${inv.economic_order_qty}, '${inv.stock_status}')`
).join(',\n');
sql += invSqlValues + ';\n\n';

// 6. Seed Purchase Orders (Draft, Issued, In Transit, Received)
sql += `-- 6. Seed Purchase Orders & Pipeline\n`;
sql += `INSERT INTO purchase_orders (id, po_number, supplier_id, warehouse_id, status, total_amount, trigger_type, expected_delivery_date) VALUES\n`;

const poList = [];
const poItemsList = [];
let poItemId = 1;

for (let i = 1; i <= 60; i++) {
  const supId = randInt(1, supplierNames.length);
  const whId = randInt(1, warehouses.length);
  const statuses = ['Draft', 'Draft', 'Issued', 'Issued', 'In Transit', 'In Transit', 'In Transit', 'Received', 'Cancelled'];
  const status = statuses[i % statuses.length];
  const trigger = i % 3 === 0 ? 'AUTOMATED_ROP' : 'MANUAL';
  const deliveryDays = randInt(2, 14);
  const deliveryDate = new Date(Date.now() + deliveryDays * 86400000).toISOString().split('T')[0];
  const poNum = `PO-2026-${String(2000 + i)}`;

  // Generate 2-4 items for each PO
  let totalPoAmount = 0;
  const numItems = randInt(2, 4);
  const supProducts = products.filter(p => p.supplier_id === supId);
  const candidateProducts = supProducts.length > 0 ? supProducts : products.slice(0, 10);

  for (let k = 0; k < numItems; k++) {
    const prod = randChoice(candidateProducts);
    const qty = randInt(25, 200);
    const subtotal = parseFloat((qty * prod.unit_price).toFixed(2));
    totalPoAmount += subtotal;

    poItemsList.push({
      id: poItemId++,
      po_id: i,
      product_id: prod.id,
      quantity: qty,
      unit_price: prod.unit_price,
      subtotal: subtotal
    });
  }

  poList.push({
    id: i,
    po_number: poNum,
    supplier_id: supId,
    warehouse_id: whId,
    status,
    total_amount: parseFloat(totalPoAmount.toFixed(2)),
    trigger_type: trigger,
    expected_delivery_date: deliveryDate
  });
}

const poSqlValues = poList.map(po => 
  `(${po.id}, '${po.po_number}', ${po.supplier_id}, ${po.warehouse_id}, '${po.status}', ${po.total_amount}, '${po.trigger_type}', '${po.expected_delivery_date}')`
).join(',\n');
sql += poSqlValues + ';\n\n';

sql += `-- 7. Seed Purchase Order Line Items\n`;
sql += `INSERT INTO po_items (id, po_id, product_id, quantity, unit_price, subtotal) VALUES\n`;
const poItemSqlValues = poItemsList.map(pi => 
  `(${pi.id}, ${pi.po_id}, ${pi.product_id}, ${pi.quantity}, ${pi.unit_price}, ${pi.subtotal})`
).join(',\n');
sql += poItemSqlValues + ';\n\n';

// 8. Seed Shipments & Interpolated Route Geometries (50+ active shipments)
sql += `-- 8. Seed Logistics Shipments with Realistic Waypoint Geometries\n`;
sql += `INSERT INTO shipments (id, tracking_number, carrier, po_id, origin_warehouse_id, destination_warehouse_id, status, current_latitude, current_longitude, current_speed_mph, current_heading_deg, eta_timestamp, route_geometry) VALUES\n`;

const shipments = [];
const telemetryLogs = [];
let telemId = 1;

for (let s = 1; s <= 55; s++) {
  const originWhId = randInt(1, warehouses.length);
  let destWhId = randInt(1, warehouses.length);
  while (destWhId === originWhId) {
    destWhId = randInt(1, warehouses.length);
  }

  const originWh = warehouses[originWhId - 1];
  const destWh = warehouses[destWhId - 1];
  const waypoints = interpolateWaypoints(originWh.lat, originWh.lng, destWh.lat, destWh.lng, 20);

  // Current progress along the route (e.g. 10% to 90%)
  const curIdx = randInt(2, waypoints.length - 3);
  const curPos = waypoints[curIdx];
  const nextPos = waypoints[curIdx + 1];

  // Approximate heading calculation in degrees
  const dLat = nextPos[0] - curPos[0];
  const dLng = nextPos[1] - curPos[1];
  const heading = Math.round((Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360);

  const statuses = ['In Transit', 'In Transit', 'In Transit', 'Delayed', 'In Transit', 'Pending'];
  const status = statuses[s % statuses.length];
  const speed = status === 'Delayed' ? randFloat(0, 15, 1) : randFloat(52, 68, 1);
  const carrier = randChoice(carriers);
  const tracking = `TRK-${carrier.substring(0, 3).toUpperCase()}-${String(800000 + s)}`;
  const etaHours = randInt(4, 72);
  const etaTime = new Date(Date.now() + etaHours * 3600000).toISOString().slice(0, 19).replace('T', ' ');

  // Link to a PO if applicable
  const linkedPo = poList.find(p => p.status === 'In Transit' && p.warehouse_id === destWhId);
  const poIdVal = linkedPo ? linkedPo.id : 'NULL';

  shipments.push({
    id: s,
    tracking_number: tracking,
    carrier,
    po_id: poIdVal,
    origin_warehouse_id: originWhId,
    destination_warehouse_id: destWhId,
    status,
    current_latitude: curPos[0],
    current_longitude: curPos[1],
    current_speed_mph: speed,
    current_heading_deg: heading,
    eta_timestamp: etaTime,
    route_geometry: JSON.stringify(waypoints)
  });

  // Generate 5-10 historic telemetry logs for each shipment
  for (let h = Math.max(0, curIdx - 5); h <= curIdx; h++) {
    const pt = waypoints[h];
    const logTime = new Date(Date.now() - (curIdx - h) * 15 * 60000).toISOString().slice(0, 19).replace('T', ' ');
    telemetryLogs.push({
      id: telemId++,
      shipment_id: s,
      latitude: pt[0],
      longitude: pt[1],
      speed_mph: speed,
      heading_deg: heading,
      signal_strength_pct: randInt(92, 100),
      recorded_at: logTime
    });
  }
}

const shipSqlValues = shipments.map(sh => 
  `(${sh.id}, '${sh.tracking_number}', '${sh.carrier}', ${sh.po_id}, ${sh.origin_warehouse_id}, ${sh.destination_warehouse_id}, '${sh.status}', ${sh.current_latitude}, ${sh.current_longitude}, ${sh.current_speed_mph}, ${sh.current_heading_deg}, '${sh.eta_timestamp}', '${sh.route_geometry.replace(/'/g, "\\'")}')`
).join(',\n');
sql += shipSqlValues + ';\n\n';

sql += `-- 9. Seed Telemetry Ingestion Log History\n`;
sql += `INSERT INTO telemetry_logs (id, shipment_id, latitude, longitude, speed_mph, heading_deg, signal_strength_pct, recorded_at) VALUES\n`;
const telemSqlValues = telemetryLogs.map(tl => 
  `(${tl.id}, ${tl.shipment_id}, ${tl.latitude}, ${tl.longitude}, ${tl.speed_mph}, ${tl.heading_deg}, ${tl.signal_strength_pct}, '${tl.recorded_at}')`
).join(',\n');
sql += telemSqlValues + ';\n\n';

fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
console.log(`✅ SUCCESS! Generated ${products.length} Products, ${inventoryRows.length} Inventory points, ${poList.length} POs, ${shipments.length} Shipments, and ${telemetryLogs.length} Telemetry records.`);
console.log(`📁 Wrote ${sql.length.toLocaleString()} bytes to ${OUTPUT_FILE}`);
