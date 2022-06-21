const express = require('express');
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.pass,
    database: process.env.database
});

// con.connect(function(err) {
//   if (err) throw err;
//   //Select all customers and return the result object:
//   con.query("SELECT * FROM grocery.destination", function (err, result, fields) {
//     if (err) throw err;
//     console.log(result);
//   });
// });


// con.connect(function(err) {
//     if (err) throw err;
//     //Select all customers and return the result object:
//     con.query("SELECT * FROM grocery.city", function (err, result, fields) {
//       if (err) throw err;
//       console.log(result);
//     });
//   });

exports.forgot_password = (req, res) => {
  var username = req.body;
  var sql = 'SELECT * FROM users WHERE username = ?';
  console.log(sql);
  con.query(sql,[username], async function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
}
