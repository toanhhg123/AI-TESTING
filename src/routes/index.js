const router = require('express').Router();

const adminRoutes = require('./admin.routes');
const authRoutes = require('./auth.routes');
const cartRoutes = require('./cart.routes');
const healthRoutes = require('./health.routes');
const orderRoutes = require('./order.routes');
const productRoutes = require('./product.routes');
const couponRoutes = require('./coupon.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/coupons', couponRoutes);

module.exports = router;
