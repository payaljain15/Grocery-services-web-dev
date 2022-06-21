const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('login');
});

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.get('/forgot_password', (req, res) => {
    res.render('forgot_password');
});

router.get('/welcome', (req, res) => {
    res.render('welcome');
});

router.get('/overview', (req, res) => {
    res.render('overview')
})

module.exports = router;