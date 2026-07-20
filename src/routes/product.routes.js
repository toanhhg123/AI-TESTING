const router = require('express').Router();

const productController = require('../controllers/product.controller');
const categoryController = require('../controllers/category.controller');
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', productController.listPublicProducts);
router.get('/search', productController.searchProducts);
router.get('/recommendations', productController.getRecommendations);
router.get('/categories', categoryController.listCategories);
router.get('/:id', productController.getProductDetail);
router.get('/:id/similar', productController.getSimilarProducts);
router.post('/:id/reviews', authenticate, reviewController.createReview);

module.exports = router;
