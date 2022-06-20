const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

router.post('/register',authController.register)

router.post('/forgot_password' , authController.forgot_password)
module.exports = router;