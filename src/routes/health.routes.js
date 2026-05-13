const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mobile-commerce-api',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
