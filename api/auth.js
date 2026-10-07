export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  
  res.status(200).json({
    success: true,
    message: 'Authentication successful.',
    token: 'mock-jwt-token-123',
    user: { id: 1, username: body.username || 'admin', role: 'admin' }
  });
}
