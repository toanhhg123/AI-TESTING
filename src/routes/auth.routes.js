const router = require('express').Router();

const placeholderController = require('../controllers/placeholder.controller');

router.post('/register', placeholderController.notImplemented('Register customer'));
router.post('/login', placeholderController.notImplemented('Login customer or admin'));
router.post('/logout', placeholderController.notImplemented('Logout current user'));
router.get('/me', placeholderController.notImplemented('Get current user profile'));

module.exports = router;
