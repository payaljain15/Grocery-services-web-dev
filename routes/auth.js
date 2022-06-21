const express = require('express');
const authController = require('../controllers/auth');
const authcontroller = require('../controllers/select');
const router = express.Router();

router.post('/register',authController.register)

router.post('/forgot_password' , authcontroller.forgot_password)
module.exports = router;