/**
 * Zero-Dependency Pure Node.js HTTP Server (Updated with Auth Mock)
 * Uses only built-in modules ('http', 'fs', 'path', 'url') so it runs on ANY machine
 * without needing `npm install` or PHP/MySQL.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// In-memory demo data store
let inventoryState = [
  { product_id: 1, warehouse_id: 1, sku: 'SKU-SEM-1001', product_name: 'ARM-M4 High-Precision MCU (Rev A.1)', warehouse_code: 'WH-ORD-01', quantity_on_hand: 18, reorder_point: 85, economic_order_qty: 120, stock_status: 'CRITICAL_REORDER', unit_price: 14.50 },
  { product_id: 2, warehouse_id: 2, sku: 'SKU-LIT-1002', product_name: 'LiFePO4 Modular 48V Battery (Rev B.2)', warehouse_code: 'WH-DFW-02', quantity_on_hand: 52, reorder_point: 60, economic_order_qty: 80, stock_status: 'LOW_STOCK', unit_price: 890.00 },
  { product_id: 3, warehouse_id: 3, sku: 'SKU-OPT-1003', product_name: 'Solid-State Lidar 120m Array (Rev C.1)', warehouse_code: 'WH-LAX-03', quantity_on_hand: 140, reorder_point: 45, economic_order_qty: 90, stock_status: 'OPTIMAL', unit_price: 620.00 },
  { product_id: 4, warehouse_id: 4, sku: 'SKU-ROB-1004', product_name: 'Brushless DC Servo Actuator (Rev A.3)', warehouse_code: 'WH-EWR-04', quantity_on_hand: 9, reorder_point: 40, economic_order_qty: 60, stock_status: 'CRITICAL_REORDER', unit_price: 112.00 },
  { product_id: 5, warehouse_id: 5, sku: 'SKU-RF-1005', product_name: 'CAN-Bus Telemetry Gateway v4', warehouse_code: 'WH-ATL-05', quantity_on_hand: 88, reorder_point: 50, economic_order_qty: 110, stock_status: 'OPTIMAL', unit_price: 95.00 },
  { product_id: 6, warehouse_id: 6, sku: 'SKU-AVI-1006', product_name: 'Tactical IMU Gyroscope Module', warehouse_code: 'WH-SEA-06', quantity_on_hand: 22, reorder_point: 35, economic_order_qty: 55, stock_status: 'LOW_STOCK', unit_price: 430.00 },
  { product_id: 7, warehouse_id: 7, sku: 'SKU-HEA-1007', product_name: 'Titanium Chassis Bolt M10-Titan', warehouse_code: 'WH-DEN-07', quantity_on_hand: 320, reorder_point: 100, economic_order_qty: 250, stock_status: 'OPTIMAL', unit_price: 4.80 }
];

let poList = [
  { id: 1, po_number: 'PO-2026-2001', supplier_name: 'Apex Micro Silicon', warehouse_code: 'WH-ORD-01', status: 'Draft', total_amount: 14500.00, trigger_type: 'AUTOMATED_ROP', item_count: 3 },
  { id: 2, po_number: 'PO-2026-2002', supplier_name: 'Kyoto Optics Corp', warehouse_code: 'WH-LAX-03', status: 'Draft', total_amount: 32400.00, trigger_type: 'MANUAL', item_count: 2 },
  { id: 3, po_number: 'PO-2026-2003', supplier_name: 'Seoul Lithium Battery', warehouse_code: 'WH-DFW-02', status: 'Issued', total_amount: 71200.00, trigger_type: 'AUTOMATED_ROP', item_count: 4 },
  { id: 4, po_number: 'PO-2026-2004', supplier_name: 'Bavaria Precision', warehouse_code: 'WH-EWR-04', status: 'In Transit', total_amount: 18900.00, trigger_type: 'MANUAL', item_count: 2 },
  { id: 5, po_number: 'PO-2026-2005', supplier_name: 'Zurich Actuator Systems', warehouse_code: 'WH-ATL-05', status: 'Received', total_amount: 24600.00, trigger_type: 'AUTOMATED_ROP', item_count: 3 }
];

let shipments = [
  {
    id: 1,
    tracking_number: 'TRK-MAE-800001',
    carrier: 'Maersk Global',
    status: 'In Transit',
    current_position: { lat: 38.6270, lng: -90.1994, speed_mph: 58.4, heading_deg: 215 },
    route_geometry: [
      [41.9742, -87.9073], [40.8500, -89.2000], [38.6270, -90.1994], [35.4676, -97.5164], [32.8998, -97.0403]
    ]
  },
  {
    id: 2,
    tracking_number: 'TRK-FED-800002',
    carrier: 'FedEx Freight',
    status: 'In Transit',
    current_position: { lat: 31.8637, lng: -102.368, speed_mph: 64.2, heading_deg: 260 },
    route_geometry: [
      [32.8998, -97.0403], [31.8637, -102.368], [32.2226, -110.974], [34.0537, -117.5982]
    ]
  },
  {
    id: 3,
    tracking_number: 'TRK-DHL-800003',
    carrier: 'DHL Express',
    status: 'Delayed',
    current_position: { lat: 38.9072, lng: -77.0369, speed_mph: 8.5, heading_deg: 205 },
    route_geometry: [
      [40.6895, -74.1745], [38.9072, -77.0369], [35.7796, -78.6382], [33.6407, -84.4277]
    ]
  }
];

// Helper to send JSON responses
function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // 0. API: Auth Mock
  if (pathname === '/api/auth.php' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    return req.on('end', () => {
      const parsedBody = body ? JSON.parse(body) : {};
      return sendJson(res, {
        success: true,
        message: 'Authentication successful.',
        token: 'mock-jwt-token-123',
        user: { id: 1, username: parsedBody.username || 'admin', role: 'admin' }
      });
    });
  }

  // 1. API: Inventory
  if (pathname === '/api/inventory.php') {
    if (req.method === 'GET') {
      return sendJson(res, { success: true, count: inventoryState.length, inventory: inventoryState });
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      return req.on('end', () => {
        const parsedBody = body ? JSON.parse(body) : {};
        const { product_id, warehouse_id, quantity } = parsedBody;
        const item = inventoryState.find(i => i.product_id == product_id && i.warehouse_id == warehouse_id);
        if (!item) return sendJson(res, { success: false, error: 'Item not found' }, 404);

        const prev = item.quantity_on_hand;
        item.quantity_on_hand = Math.max(0, item.quantity_on_hand - (quantity || 25));

        if (item.quantity_on_hand <= 0) item.stock_status = 'OUT_OF_STOCK';
        else if (item.quantity_on_hand < item.reorder_point * 0.7) item.stock_status = 'CRITICAL_REORDER';
        else if (item.quantity_on_hand <= item.reorder_point) item.stock_status = 'LOW_STOCK';
        else item.stock_status = 'OPTIMAL';

        let autoPo = null;
        if (item.quantity_on_hand <= item.reorder_point) {
          autoPo = {
            po_number: `PO-AUTO-${Date.now().toString().slice(-4)}`,
            total_amount: Math.round(item.economic_order_qty * item.unit_price)
          };
          poList.unshift({
            id: poList.length + 1,
            po_number: autoPo.po_number,
            supplier_name: 'Apex Micro Silicon',
            warehouse_code: item.warehouse_code,
            status: 'Draft',
            total_amount: autoPo.total_amount,
            trigger_type: 'AUTOMATED_ROP',
            item_count: 1
          });
        }

        return sendJson(res, {
          success: true,
          inventory: {
            new_quantity: item.quantity_on_hand,
            previous_quantity: prev,
            stock_status: item.stock_status
          },
          automated_po: autoPo
        });
      });
    }
  }

  // 2. API: Shipments
  if (pathname === '/api/shipments.php') {
    return sendJson(res, { success: true, count: shipments.length, shipments });
  }

  // 3. API: Purchase Orders
  if (pathname === '/api/purchase_orders.php') {
    if (req.method === 'GET') {
      const kanban = {
        'Draft': poList.filter(p => p.status === 'Draft'),
        'Issued': poList.filter(p => p.status === 'Issued'),
        'In Transit': poList.filter(p => p.status === 'In Transit'),
        'Received': poList.filter(p => p.status === 'Received')
      };
      return sendJson(res, { success: true, orders: poList, kanban });
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      return req.on('end', () => {
        const parsedBody = body ? JSON.parse(body) : {};
        if (parsed.query.action === 'create') {
           const newPo = {
             id: poList.length + 1,
             po_number: `PO-MAN-${Date.now().toString().slice(-4)}`,
             supplier_name: 'Manual Vendor Entry',
             warehouse_code: parsedBody.warehouse_code || 'WH-GEN',
             status: 'Draft',
             total_amount: Math.round(parsedBody.quantity * 50) || 5000,
             trigger_type: 'MANUAL',
             item_count: 1
           };
           poList.unshift(newPo);
           return sendJson(res, { success: true, order: newPo, message: 'PO Created Successfully' });
        } else {
           const { id, status } = parsedBody;
           const po = poList.find(p => p.id == id);
           if (po) po.status = status;
           return sendJson(res, { success: true, message: `PO status updated to ${status}` });
        }
      });
    }
  }

  // 4. Static Files (SPA)
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  // If path doesn't have an extension, serve index.html (SPA Fallback)
  if (!ext) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e, html) => {
          if (e) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SCM 4K Command Center Live Preview Server Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`✨ Zero external dependencies needed.`);
  console.log(`=======================================================`);
});
