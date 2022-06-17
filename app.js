const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config({path: './.env'})
const app = express();
var db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.pass,
  database: process.env.database
});

const publicDirectory = path.join(__dirname, 'public')
app.use(express.static(publicDirectory));

//Parse URL-encoded bodies as sent by html form
app.use(express.urlencoded({extended: false}));
//Parse JSON bodies as sent by API clients
app.use(express.json());
app.set('view engine' , 'hbs');

db.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});


//Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));


app.get('/createdb', (req, res) => {
  let sql = 'CREATE DATABASE grocery';
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send('database created successfully');
  });
});

app.get('/login.html', (req, res) =>
{
    res.send("<h1>Home Page</h1>")    
});

app.listen('3000', () => {
  console.log('Hey there! port 3000');
});