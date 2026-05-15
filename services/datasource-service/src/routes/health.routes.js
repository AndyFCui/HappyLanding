const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'datasource-service', timestamp: new Date().toISOString() });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'ready', service: 'datasource-service', timestamp: new Date().toISOString() });
});

module.exports = router;