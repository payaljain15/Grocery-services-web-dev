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
//Parse URL-encoded bodies as sent by html form
app.use(express.urlencoded({extended: false}));
//Parse JSON bodies as sent by API clients
app.use(express.json());

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
    var username = req.body;
    var usern = JSON.stringify(username);
    const user = usern.split('"');
    var sql = 'SELECT email FROM users WHERE username = "' + user[3] + '"';
    console.log(sql);
    db.query(sql, function (err, result, fields) {
        if (err) throw err;
        if(result.length < 1) {
            res.render('signup', {message: 'The username is not registered with us.'});
        }
        console.log(result);
        // var nodemailer = require('nodemailer');

        // var transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.E,
        //         pass: process.env.P
        //     }
        // });

        // var mailOptions = {
        //     from: process.env.E,
        //     to: result.email,
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

exports.login = async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;
    var usern = JSON.stringify(username);
    const user = usern.split('"');
    console.log(user[1]);
    var sql = 'SELECT userpass FROM users WHERE username = "' + user[1] + '"';
    console.log(sql);
    // db.query(sql, function (err, result, fields) {
    //     if (err) throw err;
    //     if(result.length  < 1){
    //         res.render('error', {
    //             message: 'No users found'
    //         })
    //     }
    //     if(await bcrypt.compare(password, result.password)){

    //     }
}

