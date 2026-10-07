let poList = [
  { id: 1, po_number: 'PO-2026-2001', supplier_name: 'Apex Micro Silicon', warehouse_code: 'WH-ORD-01', status: 'Draft', total_amount: 14500.00, trigger_type: 'AUTOMATED_ROP', item_count: 3 },
  { id: 2, po_number: 'PO-2026-2002', supplier_name: 'Kyoto Optics Corp', warehouse_code: 'WH-LAX-03', status: 'Draft', total_amount: 32400.00, trigger_type: 'MANUAL', item_count: 2 },
  { id: 3, po_number: 'PO-2026-2003', supplier_name: 'Seoul Lithium Battery', warehouse_code: 'WH-DFW-02', status: 'Issued', total_amount: 71200.00, trigger_type: 'AUTOMATED_ROP', item_count: 4 },
  { id: 4, po_number: 'PO-2026-2004', supplier_name: 'Bavaria Precision', warehouse_code: 'WH-EWR-04', status: 'In Transit', total_amount: 18900.00, trigger_type: 'MANUAL', item_count: 2 },
  { id: 5, po_number: 'PO-2026-2005', supplier_name: 'Zurich Actuator Systems', warehouse_code: 'WH-ATL-05', status: 'Received', total_amount: 24600.00, trigger_type: 'AUTOMATED_ROP', item_count: 3 }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const kanban = {
      'Draft': poList.filter(p => p.status === 'Draft'),
      'Issued': poList.filter(p => p.status === 'Issued'),
      'In Transit': poList.filter(p => p.status === 'In Transit'),
      'Received': poList.filter(p => p.status === 'Received')
    };
    return res.status(200).json({ success: true, orders: poList, kanban });
  }

  if (req.method === 'POST') {
    const action = req.query.action;
    const body = req.body || {};

    if (action === 'create') {
      const newPo = {
        id: poList.length + 1,
        po_number: `PO-MAN-${Date.now().toString().slice(-4)}`,
        supplier_name: 'Manual Vendor Entry',
        warehouse_code: body.warehouse_code || 'WH-GEN',
        status: 'Draft',
        total_amount: Math.round(body.quantity * 50) || 5000,
        trigger_type: 'MANUAL',
        item_count: 1
      };
      poList.unshift(newPo);
      return res.status(200).json({ success: true, order: newPo, message: 'PO Created Successfully' });
    } else {
      const { id, status } = body;
      const po = poList.find(p => p.id == id);
      if (po) po.status = status;
      return res.status(200).json({ success: true, message: `PO status updated to ${status}` });
    }
  }
}
