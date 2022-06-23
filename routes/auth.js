const express = require('express');
const authController = require('../controllers/auth');
const authcontroller = require('../controllers/select');
const router = express.Router();

router.post('/register',authController.register)
router.post('/login', authController.login)
router.post('/forgot_password' , authController.forgot_password)
// router.post('/otp' , authController.otp)
module.exports = router;