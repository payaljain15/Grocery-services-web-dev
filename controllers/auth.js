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
const { get } = require('http');
// const { NOW } = require('sequelize');

dotenv.config({ path: './.env' })
const app = express();
var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.pass,
    database: process.env.database
});
//Parse URL-encoded bodies as sent by html form
app.use(express.urlencoded({ extended: false }));
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
    res.clearCookie('jwt_token', { path: '/' });
    var user = req.body;
    console.log(user.username);
    var otp = Math.floor((Math.random() * 10000) + 1);
    console.log("otp: ", otp);

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
    console.log(sql);
    db.query(sql, [user.username], async (err, result, fields) => {
        if (err) throw err;
        if (result.length < 1) {
            res.render('signup', { message: 'The username is not registered with us.' });
        }

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


        var mailOptions = {
            from: process.env.E,
            to: result[0].email,
            subject: 'OTP Confirmation',
            template: 'email',
            context: {
                name: otp
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
    console.log(req.body.username, req.body.password);
    res.clearCookie('jwt_token', { path: '/' });
    var sql = 'SELECT userpass,fullname FROM users WHERE username = "' + req.body.username + '"';
    console.log(sql);
    db.query(sql, async function (err, result, fields) {
        if (err) throw err;
        if (result.length < 1) {
            return res.render('login', {
                message: 'No users found'
            });
        }
        if (await bcrypt.compare(req.body.password, result[0].userpass)) {
            console.log('Done');
            const token = jwt.sign(
                {
                    username: req.body.username,
                    name: result[0].fullname
                },
                JWTSecret
            );
            console.log('Token: ' + token);
            await res.cookie('jwt_token', token, { path: '/' });
            return res.render('welcome', {
                data: result[0].fullname
            });
        }
        else return res.render('login', { message: 'Invalid Password' });
    });
}


exports.otp = async (req, res) => {
    console.log(req.body.otp);
    const token = req.cookies.jwt_token;
    if (token) {
        jwt.verify(token, process.env.JWT, (err, decodedtoken) => {
            if (err) {
                console.log(err);
                res.render('login',
                    {
                        message: 'Please try again. There was some problem with the request.'
                    });
            } else {
                console.log(decodedtoken);
                const user = decodedtoken;
                console.log(user.username);
                if (req.body.otp == user.otp) {
                    res.clearCookie('jwt_token', { path: '/' });
                    const token = jwt.sign(
                        {
                            username: user.username
                        },
                        JWTSecret
                    )
                    console.log('4', 'Token: ' + token);
                    res.cookie('jwt_token', token, { path: '/' });
                    res.render('change_pass');
                }
                else {
                    res.render('login', {
                        message: 'Invalid OTP.'
                    });
                }
            }
        });
    }
    else {
        res.render('login', { message: 'There was some problem with the request' });
    }
}


exports.change_pass = async (req, res) => {
    const token = req.cookies.jwt_token;
    const user = jwt.verify(token, JWTSecret);
    const { newpass, confirmpass } = req.body;
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
    db.query(sql, [hashedpassword, user.username]);
    res.render("login", {
        message: 'Password Successfully changed'
    });
}

exports.logout = async (req, res) => {
    console.log('logout');
    await res.clearCookie('jwt_token', { path: '/' });
    await res.clearCookie('location', { path: '/' });
    await res.clearCookie('date', { path: '/' });
    await res.clearCookie('time', { path: '/' });
    await res.clearCookie('city_name', { path: '/' });
    await res.clearCookie('quantity', { path: '/' });
    await res.clearCookie('gtotal', { path: '/' });
    await res.clearCookie('tripid', { path: '/' });
    await res.clearCookie('table', { path: '/' });
    await res.clearCookie('games', { path: '/' });
    return res.render('login', { message: 'User successfully logout' });
}


exports.welcome = async (req, res) => {
    jwt.verify(req.cookies.jwt_token, JWTSecret, (err, decodedtoken) => {
        if (err) throw err;
        const user = decodedtoken.name;
        res.render('welcome', { data: user });
    });
}


exports.images = async (req, res) => {
    const city_name = req.body.locationlist;
    res.clearCookie('city_name', { path: '/' });
    res.cookie('city_name', city_name, { path: '/' });
    db.query('SELECT des_name,images,description FROM destination WHERE destination.city_id = (SELECT city_id FROM city WHERE city_name = ?)', [city_name], async (err, result) => {
        if (err) throw err;
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
            return res.render("Overview", { city: city_name, img1: img1, img2: img2, img3: img3, img4: img4, description: description, description2: description2, description3: description3, description4: description4, loc1: loc1, loc2: loc2, loc3: loc3, loc4: loc4 });
        }
    });
}

exports.category = async (req, res) => {
    console.log(new Date(req.body.date).toISOString());
    console.log(1);
    res.clearCookie('location', { path: '/' });
    res.clearCookie('date', { path: '/' });
    res.clearCookie('time', { path: '/' });
    res.clearCookie('quantity', { path: '/' });
    res.cookie('location', req.body.locationlist, { path: '/' });
    res.cookie('date', req.body.date, { path: '/' });
    res.cookie('time', req.body.timeslot, { path: '/' });
    res.cookie('quantity', req.body.quantity, { path: '/' });
    const location = req.body.locationlist;
    db.query("SELECT images FROM destination WHERE destination.des_name = ?", [location], async (err, result) => {
        if (err) throw err;
        else {
            const img = result[0].images;
            res.render('category', { location: location, img: img });
        }
    });
}

exports.table = async (req, res) => {
    db.query('SELECT dec_id,price,table_name,images FROM decoration', async (err, result) => {
        if (err) throw err;
        else {
            let i = 0;
            let msg = '';
            for (i = 0; i < result.length; i++) {
                let temp = '<option value="' + result[i].images + '">' + result[i].table_name + ' - ' + result[i].price + 'Rs </option>'
                msg = msg + temp;
            }
            return res.render('table', { msg: msg });
        }
    });
}

exports.bill = async function (req, res) {
    const util = require('util');
    const query = util.promisify(db.query).bind(db);
    // var today = Date.now();
    const tripid = (new Date()).getTime();
    var table = req.body.tablelist;
    var games = 0;
    if (req.body.game) {
        games = req.body.game;
    }
    var user;
    jwt.verify(req.cookies.jwt_token, JWTSecret, (err, decodedtoken) => {
        if (err) throw err;
        user = decodedtoken.name;
    });
    res.clearCookie('tripid', { path: '/' });
    res.clearCookie('table', { path: '/' });
    res.clearCookie('games', { path: '/' });
    res.cookie('tripid', tripid, { path: '/' });
    res.cookie('table', table, { path: '/' });
    res.cookie('games', games, { path: '/' });
    table = await query('SELECT table_name,price FROM decoration WHERE images = ?', [table]);
    table_name = table[0].table_name;
    var tprice = table[0].price;
    var game = "";
    var sum = 0;
    if (games == 0) {
        game = 'NONE';
    }
    else if (games.length == 1) {
        const result = await query('SELECT game_name,price FROM games WHERE game_id = ?', [games]);
        game = result[0].game_name;
        sum = result[0].price;
    }
    else {
        const result = await query('SELECT game_name,price FROM games WHERE game_id IN ?', [[games]]);
        for (let i = 0; i < result.length; i++) {
            game = game + result[i].game_name;
            sum = sum + result[i].price;
            if (i < result.length - 1) game = game + ',';
        }
    }
    console.log("user: " + user);
    const userinfo = await query('SELECT email,contactnumber FROM users WHERE fullname = ?', [user]);
    // const name = userinfo[0].fullname;
    const email = userinfo[0].email;
    const contact = userinfo[0].contactnumber;
    const date = Date.now();
    const d = new Date(date).toLocaleDateString();
    const Time = new Date(date).toLocaleTimeString();

    const quantity = req.cookies.quantity;
    const stotal = tprice + sum + quantity * 1000;
    const cgst = stotal * 0.025;
    const sgst = stotal * 0.025;
    const gtotal = stotal + cgst + sgst;
    res.clearCookie('gtotal', { path: '/' });
    res.cookie('gtotal', gtotal, { path: '/' });
    res.render('bill', { name: user, email: email, phone: contact, date: d, games: game, sum: sum, time: Time, tripid: tripid, tablename: table_name, timeslot: req.cookies.time, location: req.cookies.location, city: req.cookies.city_name, persons: req.cookies.quantity, tprice: tprice, stotal: stotal, cgst: cgst, sgst: sgst, gtotal: gtotal });
}


exports.confirmtrip = async (req, res) => {
    const city = req.cookies.city_name;
    const date = req.cookies.date;
    const Game = req.cookies.games;
    const tripid = req.cookies.tripid;
    const location = req.cookies.location;
    const timeslot = req.cookies.time;
    const quantity = req.cookies.quantity;
    const table = req.cookies.table;
    const gtotal = req.cookies.gtotal;
    var user;
    jwt.verify(req.cookies.jwt_token, JWTSecret, (err, decodedtoken) => {
        if (err) throw err;
        user = decodedtoken.username;
    });
    const util = require('util');
    const query = util.promisify(db.query).bind(db);
    const ac = await query('INSERT INTO trips(tripid,city,location,tdate,timeslot,quantity,tablename,gtotal,username) VALUES (?,?,?,?,?,?,?,?,?)', [tripid, city, location, date, timeslot, quantity, table, gtotal, user]);
    console.log(ac);
    if (Game != 0 && Game.length != 1) {
        const result = await query('SELECT game_name,price FROM games WHERE game_id IN ?', [[Game]]);
        for (let i = 0; i < result.length; i++) {
            await query('INSERT INTO rgames(tripid,game,price,username) VALUES (?,?,?,?)', [tripid, Game[i], result[i].price, user]);
        }
    }
    else if (Game.length == 1 && Game != 0) {
        const result = await query('SELECT game_name,price FROM games WHERE game_id = ?', [Game]);
        await query('INSERT INTO rgames(tripid,game,price,username) VALUES (?,?,?,?)', [tripid, Game, result[0].price, user]);
    }
    await query('INSERT INTO usertrips(tripid,username) VALUES (?,?)', [tripid, user]);
    const userinfo = await query('SELECT fullname,email,contactnumber FROM users WHERE username = ?', [user]);
    const name = userinfo[0].fullname;
    const email = userinfo[0].email;
    const contact = userinfo[0].contactnumber;
    console.log(name, email, contact);
    var msg = '';
    const Tripid = await query('SELECT tripid FROM usertrips WHERE username = ?', [user]);
    for (let i = 0; i < Tripid.length; i++) {
        var tt = Tripid[i].tripid;
        var tripinfo = await query('SELECT * FROM trips WHERE tripid= ? AND username = ?', [tt, user]);
        var game = await query('SELECT game FROM rgames WHERE tripid = ? AND username = ?', [tt, user]);
        var games = '';
        if (game.length == 0) {
            games = 'NONE';
        }
        else if (game.length == 1) {
            game = game[0].game;
            const result = await query('SELECT game_name FROM games WHERE game_id = ?', [game]);
            games = result[0].game_name;
        }
        else {
            const result = await query('SELECT game_name FROM games WHERE game_id IN ?', [[game]]);
            if (result.length == 0) games = 'NONE';
            else {
                for (let i = 0; i < result.length; i++) {
                    games = games + result[i].game_name;
                    if (i < result.length - 1) games = games + ',';
                }
            }
        }
        console.log(tripinfo)
        var Table = await query('SELECT table_name FROM decoration WHERE images = ?', [tripinfo[0].tablename]);
        var msg = msg + '<div class="trips"><span id="city">' + tripinfo[0].city + '</span><span id="loc">' + tripinfo[0].location + '</span><span id="rest">Trip ID:' + tt + '<br>Number Of Persons:' + tripinfo[0].quantity + '<br>Date:' + new Date(tripinfo[0].tdate).toLocaleDateString() + '<br>Time Slot:' + tripinfo[0].timeslot + '<br>Table-' + Table[0].table_name + '<br>Games - ' + games + '<br><strong>Total Bill - INR ' + tripinfo[0].gtotal + '</strong></span><img src="' + tripinfo[0].tablename + '" alt="login" id="image"></div>';
    }

    return res.render('user', { msg: msg, name: name, email: email, phone: contact, user: user });
}



exports.user = async (req, res) => {
    jwt.verify(req.cookies.jwt_token, JWTSecret, (err, decodedtoken) => {
        if (err) throw err;
        user = decodedtoken.username;
    });
    const util = require('util');
    const query = util.promisify(db.query).bind(db);
    const userinfo = await query('SELECT fullname,email,contactnumber FROM users WHERE username = ?', [user]);
    const name = userinfo[0].fullname;
    const email = userinfo[0].email;
    const contact = userinfo[0].contactnumber;
    console.log(name, email, contact);
    var msg = '';
    const Tripid = await query('SELECT tripid FROM usertrips WHERE username = ?', [user]);
    console.log(Tripid);
    if (Tripid.length == 0) {
        msg = "<p>You haven't booked any trips yet.</p>";
        return res.render('user', {
            msg: msg, name: name, email: email, phone: contact, user: user
        });
    }
    else {
        for (let i = 0; i < Tripid.length; i++) {
            var tt = Tripid[i].tripid;
            console.log(tt+user);
            var tripinfo = await query('SELECT * FROM trips WHERE tripid = ? AND username = ?', [tt, user]);
            var game = await query('SELECT game FROM rgames WHERE tripid = ? AND username = ?', [tt, user]);
            var games = '';
            if (game.length == 0) {
                games = 'NONE';
            }
            else if (game.length == 1) {
                game = game[0].game;
                const result = await query('SELECT game_name FROM games WHERE game_id = ?', [game]);
                games = result[0].game_name;
            }
            else {
                const result = await query('SELECT game_name FROM games WHERE game_id IN ?', [[game]]);
                if (result.length == 0) games = 'NONE';
                else {
                    for (let i = 0; i < result.length; i++) {
                        games = games + result[i].game_name;
                        if (i < result.length - 1) games = games + ',';
                    }
                }
            }
            console.log("12"+ tripinfo[0])

            var Table = await query('SELECT table_name FROM decoration WHERE images = ?', [tripinfo[0].tablename]);
            var msg = msg + '<div class="trips"><span id="city">' + tripinfo[0].city + '</span><span id="loc">' + tripinfo[0].location + '</span><span id="rest">Trip ID:' + tt + '<br>Number Of Persons:' + tripinfo[0].quantity + '<br>Date:' + new Date(tripinfo[0].tdate).toLocaleDateString() + '<br>Time Slot:' + tripinfo[0].timeslot + '<br>Table-' + Table[0].table_name + '<br>Games - ' + games + '<br><strong>Total Bill - INR ' + tripinfo[0].gtotal + '</strong></span><img src="' + tripinfo[0].tablename + '" alt="login" id="image"></div>';
        }
    }

    return res.render('user', { msg: msg, name: name, email: email, phone: contact, user: user });
}
exports.delete = async (req, res) => {
    const tripid = req.body.delete;
    jwt.verify(req.cookies.jwt_token, JWTSecret, (err, decodedtoken) => {
        if (err) throw err;
        user = decodedtoken.name;
    });
    const util = require('util');
    const query = util.promisify(db.query).bind(db);
    await query('DELETE FROM usertrips WHERE tripid = ? AND username = ?', [tripid, user]);
    await query('DELETE FROM rgames WHERE tripid = ?', [tripid]);
    await query('DELETE FROM trips WHERE tripid = ?', [tripid]);
    this.user(req, res);
}
exports.download_bill = async (req, res) => {
    const util = require('util');
    const query = util.promisify(db.query).bind(db);
    const tripid = req.body.delete;
    var user;
    jwt.verify(req.cookies.jwt_token, JWTSecret, (err, decodedtoken) => {
        if (err) throw err;
        user = decodedtoken.username;
    });
    const tripinfo = await query('SELECT * FROM trips WHERE tripid = ? AND username = ?', [tripid, user]);
    const games = await query('SELECT game FROM rgames WHERE tripid = ? AND username = ?', [tripid, user]);
    const userinfo = await query('SELECT fullname,email,contactnumber FROM users WHERE username = ?', [user]);
    var game = '';
    var sum = 0;
    if (games == 0) {
        game = 'NONE';
    }
    else if (games.length == 1) {
        const result = await query('SELECT game_name,price FROM games WHERE game_id = ?', [games[0].game]);
        game = result[0].game_name;
        sum = result[0].price;
    }
    else {
        for (let j = 0; j < games.length; j++) {
            var result = await query('SELECT game_name,price FROM games WHERE game_id = ?', [games[j].game]);
            game = game + result[0].game_name;
            sum = sum + result[0].price;
            if (j < games.length - 1) game = game + ',';

        }
    }
    const Table = await query('SELECT table_name,price FROM decoration WHERE images = ?', [tripinfo[0].tablename]);
    const stotal = Table[0].price + sum + tripinfo[0].quantity * 1000;
    const cgst = stotal * 0.025;
    const sgst = stotal * 0.025;
    const gtotal = stotal + cgst + sgst;
    const date = Date.now();

    res.render('bill', { name: userinfo[0].fullname, phone: userinfo[0].contactnumber, email: userinfo[0].email, date: new Date(date).toLocaleDateString(), time: new Date(date).toLocaleTimeString(), tripid: tripid, location: tripinfo[0].location, city: tripinfo[0].city, persons: tripinfo[0].quantity, tablename: Table[0].table_name, games: game, tprice: Table[0].price, sum: sum, stotal: stotal, cgst: cgst, sgst: sgst, gtotal: gtotal });
}