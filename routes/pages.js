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
router.get('/category',middleware.requireAuth, (req, res) => {
    res.render('category');
});

router.get('/user',middleware.requireAuth, (req, res) => {
    res.render('user');
});
router.get('/aboutus',(req, res) => {
    res.render('aboutus');
});

router.get('/table', middleware.requireAuth,(req, res) => {
    res.render('table');
});
router.get('/playgame',middleware.requireAuth, (req, res) => {
    res.render('playgame');
});
router.get('/foodie', (req, res) => {
    res.render('foodie');
});
router.get('/delete',middleware.requireAuth, (req, res) => {
    res.render('delete');
});
router.get('/bill',middleware.requireAuth, (req, res) => {
    res.render('bill');
});
router.get('/download', middleware.requireAuth,(req, res) => {
    res.render('download');
});


module.exports = router;