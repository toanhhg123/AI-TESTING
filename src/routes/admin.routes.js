const router = require('express').Router();

const placeholderController = require('../controllers/placeholder.controller');
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', placeholderController.notImplemented('Get admin dashboard statistics'));
router.get('/users', placeholderController.notImplemented('Manage users'));
router.get('/orders', placeholderController.notImplemented('Manage orders'));
router.get('/products', productController.listAdminProducts);
router.post('/products', productController.createProduct);
router.get('/products/:id', productController.getAdminProductDetail);
router.patch('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.get('/inventory', placeholderController.notImplemented('Manage inventory'));

module.exports = router;
