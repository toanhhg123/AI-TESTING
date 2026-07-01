const router = require('express').Router();

const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Protect all cart routes with authenticate middleware
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addCartItem);
router.patch('/items/:productId', cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
