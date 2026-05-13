const router = require('express').Router();

const placeholderController = require('../controllers/placeholder.controller');

router.get('/', placeholderController.notImplemented('Get current cart'));
router.post('/items', placeholderController.notImplemented('Add item to cart'));
router.patch('/items/:productId', placeholderController.notImplemented('Update cart item quantity'));
router.delete('/items/:productId', placeholderController.notImplemented('Remove item from cart'));
router.delete('/', placeholderController.notImplemented('Clear cart'));

module.exports = router;
