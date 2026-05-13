const router = require('express').Router();

const placeholderController = require('../controllers/placeholder.controller');

router.get('/', placeholderController.notImplemented('List current customer orders'));
router.post('/', placeholderController.notImplemented('Create order from cart'));
router.get('/:id', placeholderController.notImplemented('Get order detail'));

module.exports = router;
