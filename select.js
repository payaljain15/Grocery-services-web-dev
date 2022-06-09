const express = require('express');
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Emptineful123*",
    database: "grocery",
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

con.connect(function(err) {
    if (err) throw err;
    //Select all customers and return the result object:
    con.query("SELECT * FROM grocery.games", function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
  });
