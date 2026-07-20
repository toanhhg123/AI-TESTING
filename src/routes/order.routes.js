const router = require('express').Router();

const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public route for order tracking (must be placed before /:id to prevent matching issues)
router.get('/lookup', orderController.searchOrder);

// Protected routes requiring authentication
router.get('/', authenticate, orderController.listCustomerOrders);
router.post('/', authenticate, orderController.createOrder);
router.get('/:id', authenticate, orderController.getOrderDetail);
router.post('/:id/verify-stripe', authenticate, orderController.verifyStripePayment);

module.exports = router;
