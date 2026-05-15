const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'report-service', timestamp: new Date().toISOString() });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'ready', service: 'report-service', timestamp: new Date().toISOString() });
});

module.exports = router;