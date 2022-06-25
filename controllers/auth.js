const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWTSecret = process.env.JWT;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
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
        if (password !== passwordConfirm) {
            return res.render("signup", {
                message: 'Passwords do not match.'
            });
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
    res.clearCookie('jwt_token',  { path: '/' });
    var user = req.body;
    console.log(user.username);
    var otp = Math.floor((Math.random() * 10000) + 1);
    var expire = new Date();
    expire.setMinutes(expire.getMinutes() + 5);
    console.log("otp: ", otp);
    console.log("expirein: ", expire);
        
    const token = jwt.sign(
        {
            username: user.username, 
            otp: otp
        },
        JWTSecret
    )
    console.log('Token: ' + token);
    res.cookie('jwt_token', token, { path: '/' });
    var sql = 'SELECT email FROM users WHERE username = ?';
    var sql2 = 'SELECT username FROM otp WHERE username = ?';
    console.log(sql);
    db.query(sql,[user.username], async (err, result, fields) => {
        if (err) throw err;
        if(result.length < 1) {
            res.render('signup', {message: 'The username is not registered with us.'});
        }
        // db.query(sql2, [user.username], (error, results) => {
        //     console.log("gg");
        //     if (error)
        //         throw error;
        //     if (results.length > 0) {
        //         console.log(1);
        //         db.query('DELETE FROM otp WHERE ?', { username: user.username });
        //     }
        //     else
        //         console.log('done fine');
        // });
        var usern = JSON.stringify(result);
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

        

        // db.query("INSERT INTO OTP SET ?",{ username:user.username , otp:otp , expirein : expire}, (error, results) =>{
        //     if(error)throw error;
        //     console.log(results);
        // });

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
    return res.render('confirm_otp');
}

exports.login = async (req, res) => {
    console.log(req.body);
    res.clearCookie('jwt_token',  { path: '/' });
    const username = req.body;
    var usern = JSON.stringify(username);
    const user = usern.split('"');
    console.log(user);
    const nowpass = user[7];
    var sql = 'SELECT userpass,fullname FROM users WHERE username = "' + user[3] + '"';
    console.log(sql);
    db.query(sql, async function (err, result, fields) {
        if (err) throw err;
        var userpass = JSON.stringify(result);
        const pass = userpass.split('"');
        console.log(pass);
        const password = pass[3];
        const name = pass[7];
        // console.log("name:" +name);
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
            // window.localStorage.setItem('jwt_token', token);
            console.log('Token: ' + token);
            res.cookie('jwt_token', token, { path: '/' });
            return res.render('welcome',{
                data: name
            });
        }
        else return res.render('login',{message: 'Invalid Password'});
    });
}


exports.otp = async(req,res) => {
    console.log(req.body.otp);
    db.query('DELETE FROM otp WHERE expirein < NOW()')
    const token = req.cookies.jwt_token;
    if(token){
        jwt.verify(token,process.env.JWT, (err,decodedtoken) => {
            if(err){
                console.log(err);
                res.render('login',
                {
                    message:'Please try again. There was some problem with the request.'
                });
            } else{
                console.log(decodedtoken);
                const user = decodedtoken;
                console.log(user.username);
                // db.query('SELECT otp from otp where username = ?',[user.username], async(err, res) => {
                //     console.log(res.otp);
                // });
                if(req.body.otp == user.otp)
                {
                    res.clearCookie('jwt_token',  { path: '/' });
                    const token = jwt.sign(
                        {
                            username: user.username
                        },
                        JWTSecret
                    )
                    console.log('4','Token: ' + token);
                    res.cookie('jwt_token', token, { path: '/' });
                    res.render('change_pass');
                }
                else
                {
                    res.render('login',{
                        message: 'Invalid OTP.'
                    });
                }
            }
        });
    }
    else {
        res.render('login',{message:'There was some problem with the request'});
    }
}

exports.change_pass = async(req,res) => {
    const token = req.cookies.jwt_token;
    const user = jwt.verify(token,JWTSecret);
    const { newpass, confirmpass} = req.body;
    console.log(user);
    if (newpass !== confirmpass) {
        return res.render("change_pass", {
            message: 'Passwords do not match.'
        });
    }
    if (newpass.length < 6) {
        return res.render("change_pass", {
            message: 'Password must be at least 6 characters.'
        });
    }
    if (typeof newpass !== 'string') {
        return res.render("signup", {
            message: 'Password should be string in nature.'
        });
    }
    let hashedpassword = await bcrypt.hash(newpass, 8);
    console.log(hashedpassword);


    var sql = 'UPDATE users SET userpass = ? WHERE username = ?';
    db.query(sql, [hashedpassword,user.username]);
    res.render("login",{
        message: 'Password Successfully changed'
    });
}

exports.logout= async (req, res) => {
    console.log('logout');
    await res.clearCookie('jwt_token',  { path: '/' });
    return res.render('login', { message:'User successfully logout'});
}

exports.images = async (req, res) => {
    const city_name = req.body.locationlist;
    db.query('SELECT des_name,images,description FROM destination WHERE destination.city_id = (SELECT city_id FROM city WHERE city_name = ?)',[city_name], async(err,result) => {
        if(err) throw err;
        else {
            const img1 = result[0].images;
            const img2 = result[1].images;
            const img3 = result[2].images;
            const img4 = result[3].images;
            const description = result[0].description;
            const description2 = result[1].description;
            const description3 = result[2].description;
            const description4 = result[3].description;
            const loc1 = result[0].des_name;
            const loc2 = result[1].des_name;
            const loc3 = result[2].des_name;
            const loc4 = result[3].des_name;
            return res.render("Overview",{city:city_name,img1:img1,img2:img2,img3:img3,img4:img4,description:description,description2:description2,description3:description3,description4:description4,loc1 :loc1,loc2:loc2,loc3:loc3,loc4:loc4});
        }
    });


    
}

