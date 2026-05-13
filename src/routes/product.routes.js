const router = require('express').Router();

const placeholderController = require('../controllers/placeholder.controller');

router.get('/', placeholderController.notImplemented('List products with filters'));
router.get('/search', placeholderController.notImplemented('Search products'));
router.get('/recommendations', placeholderController.notImplemented('Recommend products'));
router.get('/:id', placeholderController.notImplemented('Get product detail'));

module.exports = router;
