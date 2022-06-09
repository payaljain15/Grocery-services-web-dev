const express = require('express');
const mysql = require('mysql');

const app = express();
var db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Emptineful123*",
  database: "grocery",
});


db.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});



app.get('/createdb', (req, res) => {
  let sql = 'CREATE DATABASE grocery';
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send('database created successfully');

  });
});

app.listen('3000', () => {
  console.log('Hey there! port 3000');
});