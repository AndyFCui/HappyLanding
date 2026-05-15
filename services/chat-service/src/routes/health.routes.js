const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'chat-service', timestamp: new Date().toISOString() });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'ready', service: 'chat-service', timestamp: new Date().toISOString() });
});

module.exports = router;