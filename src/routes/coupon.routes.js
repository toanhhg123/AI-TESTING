const router = require('express').Router();
const couponController = require('../controllers/coupon.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/validate', authenticate, couponController.validateCoupon);

module.exports = router;
