export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const username = (body.username || '').trim();
  const password = (body.password || '').trim();

  // Enforce single authorized password: 123456
  if (password === '123456') {
    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token: 'jwt-auth-session-123456',
      user: { id: 1, username: username || 'admin', role: 'admin' }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Access Denied: Invalid password.'
  });
}
