export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const nodeUrl = process.env.NODE_SERVICE_URL || 'http://localhost:3000';
  const endpoint = nodeUrl.replace(/\/$/, '') + '/api/events/publish';

  const { event, payload } = req.body || {};

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Source': 'JS-SCM-API'
      },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(2000)
    });

    return res.status(200).json({
      dispatched: response.ok,
      http_code: response.status
    });
  } catch (err) {
    return res.status(200).json({ dispatched: false, error: err.message });
  }
}
