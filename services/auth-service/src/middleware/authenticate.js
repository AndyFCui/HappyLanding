const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticate };