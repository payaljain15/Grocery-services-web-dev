const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

router.post('/register',authController.register);
router.post('/login', authController.login);
router.post('/forgot_password' , authController.forgot_password);
router.post('/otp' , authController.otp);
router.post('/confirm_otp', authController.otp);
router.post('/change_pass', authController.change_pass);
router.post('/logout',authController.logout);
router.post('/images',authController.images);
router.post('/category' ,authController.category);
router.post('/user',authController.user);
router.post('/delete',authController.delete);
router.post('/welcome',authController.welcome);
module.exports = router;