const router = require('express').Router();

const placeholderController = require('../controllers/placeholder.controller');

router.get('/dashboard', placeholderController.notImplemented('Get admin dashboard statistics'));
router.get('/users', placeholderController.notImplemented('Manage users'));
router.get('/orders', placeholderController.notImplemented('Manage orders'));
router.get('/products', placeholderController.notImplemented('Manage products'));
router.get('/inventory', placeholderController.notImplemented('Manage inventory'));

module.exports = router;
