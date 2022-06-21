const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({ path: './.env' })
const app = express();
var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.pass,
    database: process.env.database
});


exports.register = (req, res) => {
    console.log(req.body);

    const { name, username, email, pnumber, password, passwordConfirm } = req.body;

    db.query('SELECT username FROM users WHERE username = ?', [username], async (error, results) => {
        if (error) {
            console.log(error);
        }
        if (results.length > 0) {
            return res.render("signup", {
                message: 'This username is already registered with us.'
            })
        }
        if (typeof password !== 'string') {
            return res.render("signup", {
                message: 'Password should be string in nature.'
            })
        }
        if (typeof username !== 'string') {
            return res.render("signup", {
                message: 'Username should be string in nature.'
            })
        }
        else if (password !== passwordConfirm) {
            return res.render("signup", {
                message: 'Passwords do not match.'
            });
            // window.alert("Passwords do not match")
        }
        if (password.length < 6) {
            return res.render("signup", {
                message: 'Password must be at least 6 characters.'
            })
        }



        let hashedpassword = await bcrypt.hash(password, 8);
        console.log(hashedpassword);

        db.query("INSERT INTO users SET ?", { fullname: name, email: email, contactnumber: pnumber, username: username, userpass: hashedpassword }, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                return res.render('login', {
                    message: "Thankyou for registering with us. Please Login with your credentials."
                });
            }
        })
    });
}

exports.forgot_password = (req, res) => {
    // console.log(req.body);
    const username = req.body;
    console.log(username);
    db.query('SELECT email FROM users WHERE username = ?',[username], (error, result,field) => {
        console.log(error, result);
        if (error) {
            console.log(error);
        }
    // var nodemailer = require('nodemailer');

    // var transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //         user: '1511payal.jain@gmail.com',
    //         pass: ''
    //     }
    // });

    // var mailOptions = {
    //     from: '201210056@nitdelhi.ac.in',
    //     to: '1511payal.jain@gmail.com',
    //     subject: 'Sending Email using Node.js',
    //     text: 'That was easy!'
    // };

    // transporter.sendMail(mailOptions, function (error, info) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log('Email sent: ' + info.response);
    //     }
    // });
    });
}

