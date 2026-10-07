// Global memory state (will reset on cold starts, but good enough for mock preview)
let inventoryState = [
  { product_id: 1, warehouse_id: 1, sku: 'SKU-SEM-1001', product_name: 'ARM-M4 High-Precision MCU (Rev A.1)', warehouse_code: 'WH-ORD-01', quantity_on_hand: 18, reorder_point: 85, economic_order_qty: 120, stock_status: 'CRITICAL_REORDER', unit_price: 14.50 },
  { product_id: 2, warehouse_id: 2, sku: 'SKU-LIT-1002', product_name: 'LiFePO4 Modular 48V Battery (Rev B.2)', warehouse_code: 'WH-DFW-02', quantity_on_hand: 52, reorder_point: 60, economic_order_qty: 80, stock_status: 'LOW_STOCK', unit_price: 890.00 },
  { product_id: 3, warehouse_id: 3, sku: 'SKU-OPT-1003', product_name: 'Solid-State Lidar 120m Array (Rev C.1)', warehouse_code: 'WH-LAX-03', quantity_on_hand: 140, reorder_point: 45, economic_order_qty: 90, stock_status: 'OPTIMAL', unit_price: 620.00 },
  { product_id: 4, warehouse_id: 4, sku: 'SKU-ROB-1004', product_name: 'Brushless DC Servo Actuator (Rev A.3)', warehouse_code: 'WH-EWR-04', quantity_on_hand: 9, reorder_point: 40, economic_order_qty: 60, stock_status: 'CRITICAL_REORDER', unit_price: 112.00 },
  { product_id: 5, warehouse_id: 5, sku: 'SKU-RF-1005', product_name: 'CAN-Bus Telemetry Gateway v4', warehouse_code: 'WH-ATL-05', quantity_on_hand: 88, reorder_point: 50, economic_order_qty: 110, stock_status: 'OPTIMAL', unit_price: 95.00 },
  { product_id: 6, warehouse_id: 6, sku: 'SKU-AVI-1006', product_name: 'Tactical IMU Gyroscope Module', warehouse_code: 'WH-SEA-06', quantity_on_hand: 22, reorder_point: 35, economic_order_qty: 55, stock_status: 'LOW_STOCK', unit_price: 430.00 },
  { product_id: 7, warehouse_id: 7, sku: 'SKU-HEA-1007', product_name: 'Titanium Chassis Bolt M10-Titan', warehouse_code: 'WH-DEN-07', quantity_on_hand: 320, reorder_point: 100, economic_order_qty: 250, stock_status: 'OPTIMAL', unit_price: 4.80 }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, count: inventoryState.length, inventory: inventoryState });
  }

  if (req.method === 'POST') {
    const { product_id, warehouse_id, quantity } = req.body || {};
    const item = inventoryState.find(i => i.product_id == product_id && i.warehouse_id == warehouse_id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

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
    }

    return res.status(200).json({
      success: true,
      inventory: { new_quantity: item.quantity_on_hand, previous_quantity: prev, stock_status: item.stock_status },
      automated_po: autoPo
    });
  }
}
