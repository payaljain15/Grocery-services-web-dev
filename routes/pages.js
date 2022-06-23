const express = require('express');
const router = express.Router();
const {requireAuth} = require('../middleware/authmiddleware');
router.get('/', (req, res) => {
    res.render('login');
});

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.get('/forgot_password', (req, res) => {
    res.render('forgot_password');
});

router.get('/welcome',requireAuth, (req, res) => {
    res.render('welcome');
});

router.get('/overview',requireAuth, (req, res) => {
    res.render('overview');
});
router.get('/confirm_otp',requireAuth, (req, res) => {
    res.render('confirm_otp');
});
router.get('/new_pass',requireAuth, (req, res) => {
    res.render('change_pass');
});

module.exports = router;