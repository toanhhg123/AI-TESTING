const router = require('express').Router();

const placeholderController = require('../controllers/placeholder.controller');
const productController = require('../controllers/product.controller');
const orderController = require('../controllers/order.controller');
const adminController = require('../controllers/admin.controller');
const importController = require('../controllers/import.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const couponController = require('../controllers/coupon.controller');
const categoryController = require('../controllers/category.controller');

router.use(authenticate);
router.use(authorize('admin'));

// Admin Dashboard Route
router.get('/dashboard', adminController.getDashboardStats);

// User Management Routes for Admin
router.get('/users', adminController.listUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.toggleUserStatus);

// Order Management Routes for Admin
router.get('/orders', orderController.listAllOrders);
router.patch('/orders/:id/status', orderController.updateOrderStatus);

// Product Management Routes for Admin
router.get('/products', productController.listAdminProducts);
router.post('/products', productController.createProduct);
router.get('/products/:id', productController.getAdminProductDetail);
router.patch('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Category Management Routes for Admin
router.get('/categories', categoryController.listCategories);
router.post('/categories', categoryController.createCategory);
router.patch('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Coupon Management Routes for Admin
router.get('/coupons', couponController.listCoupons);
router.post('/coupons', couponController.createCoupon);
router.patch('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// Goods Import Routes for Admin
router.post('/imports', importController.createImportReceipt);
router.get('/imports', importController.listImportReceipts);
router.get('/imports/:id', importController.getImportReceiptDetail);

module.exports = router;
