const router = require('express').Router();

const productController = require('../controllers/product.controller');

router.get('/', productController.listPublicProducts);
router.get('/search', productController.searchProducts);
router.get('/recommendations', productController.getRecommendations);
router.get('/:id', productController.getProductDetail);

module.exports = router;
