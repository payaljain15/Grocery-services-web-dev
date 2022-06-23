const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWTSecret = process.env.JWT;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const hbs = require('nodemailer-express-handlebars');
const { NOW } = require('sequelize');

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const router = express.Router();

router.get('/', (req, res) => {
    res.render('login');
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
            });
        }
        if (typeof password !== 'string') {
            return res.render("signup", {
                message: 'Password should be string in nature.'
            });
        }
        if (typeof username !== 'string') {
            return res.render("signup", {
                message: 'Username should be string in nature.'
            });
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
            });
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
    var user = req.body;
    console.log(user.username);
    var sql = 'SELECT email FROM users WHERE username = ?';
    console.log(sql);
    db.query(sql,[user.username], function (err, result, fields) {
        if (err) throw err;
        if(result.length < 1) {
            res.render('signup', {message: 'The username is not registered with us.'});
        }
        console.log(result);
        var usern = JSON.stringify(result);
        console.log(usern);
        const email = usern.split('"');
        console.log(email[3]);
        var nodemailer = require('nodemailer');

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.E,
                pass: process.env.P
            }
        });
        const handlebarOptions = {
            viewEngine: {
                partialsDir: path.resolve('./views/'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./views/'),
        };
        
        transporter.use('compile', hbs(handlebarOptions))

        var otp = Math.floor((Math.random() * 10000) + 1);

        console.log("otp: ", otp);

        db.query("INSERT INTO OTP SET ?",{ username:user.username , otp:otp , expirein : NOW()+300}, (error, results) =>{
            if(error)throw error;
            console.log(results);
        })

        var mailOptions = {
            from: process.env.E,
            to: email[3],
            subject: 'OTP Confirmation',
            template: 'email',
            context : {
                name : otp

            }
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    });
}

exports.login = async (req, res) => {
    console.log(req.body);
    const username = req.body;
    var usern = JSON.stringify(username);
    const user = usern.split('"');
    console.log(user);
    const nowpass = user[7];
    var sql = 'SELECT userpass FROM users WHERE username = "' + user[3] + '"';
    console.log(sql);
    db.query(sql, async function (err, result, fields) {
        if (err) throw err;
        var userpass = JSON.stringify(result);
        const pass = userpass.split('"');
        console.log(pass);
        const password = pass[3];
        if(result.length  < 1){
            return res.render('login', {
                message: 'No users found'
            });
        }
        if(await bcrypt.compare(nowpass, password)){
            console.log('Done');
            const token = jwt.sign(
                {
                    username: user[3]
                },
                JWTSecret
            )
            console.log('Token: ' + token);
            return res.render('welcome',{
                data: token
            });
        }
    });
}

