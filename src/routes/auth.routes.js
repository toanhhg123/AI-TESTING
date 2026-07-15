const router = require('express').Router();

const authController = require('../controllers/auth.controller');
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.patch('/profile', authenticate, profileController.updateProfile);
router.patch('/change-password', authenticate, profileController.changePassword);

module.exports = router;
