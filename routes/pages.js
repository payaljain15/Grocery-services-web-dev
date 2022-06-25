const express = require('express');
const router = express.Router();
const {middleware} = require('../middleware/authmiddleware');
router.get('/', (req, res) => {
    res.render('login');
});

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.get('/forgot_password', (req, res) => {
    res.render('forgot_password');
});

router.get('/welcome',middleware.requireAuth, (req, res) => {
    res.render('welcome');
});

router.get('/overview',middleware.requireAuth, (req, res) => {
    res.render('overview');
});
router.get('/confirm_otp',middleware.requireAuth, (req, res) => {
    res.render('confirm_otp');
});
router.get('/change_pass',middleware.requireAuth, (req, res) => {
    res.render('change_pass');
});
router.get('/logout',middleware.requireAuth, (req, res) => {
    res.render('logout');
});
router.get('/login',middleware.requireAuth, (req, res) => {
    res.render('login');
});


module.exports = router;