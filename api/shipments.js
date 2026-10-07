let shipments = [
  {
    id: 1, tracking_number: 'TRK-MAE-800001', carrier: 'Maersk Global', status: 'In Transit',
    current_position: { lat: 38.6270, lng: -90.1994, speed_mph: 58.4, heading_deg: 215 },
    route_geometry: [[41.9742, -87.9073], [40.8500, -89.2000], [38.6270, -90.1994], [35.4676, -97.5164], [32.8998, -97.0403]]
  },
  {
    id: 2, tracking_number: 'TRK-FED-800002', carrier: 'FedEx Freight', status: 'In Transit',
    current_position: { lat: 31.8637, lng: -102.368, speed_mph: 64.2, heading_deg: 260 },
    route_geometry: [[32.8998, -97.0403], [31.8637, -102.368], [32.2226, -110.974], [34.0537, -117.5982]]
  },
  {
    id: 3, tracking_number: 'TRK-DHL-800003', carrier: 'DHL Express', status: 'Delayed',
    current_position: { lat: 38.9072, lng: -77.0369, speed_mph: 8.5, heading_deg: 205 },
    route_geometry: [[40.6895, -74.1745], [38.9072, -77.0369], [35.7796, -78.6382], [33.6407, -84.4277]]
  }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json({ success: true, count: shipments.length, shipments });
}
