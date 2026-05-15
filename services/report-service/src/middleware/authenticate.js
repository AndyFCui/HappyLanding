const jwt = require('jsonwebtoken');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticate };