const express = require('express');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config({path: './.env'})
const app = express();
var db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.pass,
  database: process.env.database
});


exports.register = (req,res) => {
    console.log(req.body);

    const{ name,username, email, pnumber, password, passwordConfirm} = req.body;

    db.query('SELECT email_id FROM users WHERE email_id = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }
        if(results.length > 0) {
            return res.render("signup",{
                message: 'This email is already registered with us.'
            })
        }
        else if(password !== passwordConfirm) {
            return res.render("signup",{
                message: 'Passwords do not match.'
            });
        }

        let hashedpassword = await bcrypt.hash(password, 8);
        console.log(hashedpassword);

        db.query("INSERT INTO users SET ?", {full_name:name, email_id:email, contact_number:pnumber,user_name:username,user_pass:hashedpassword}, (error,results)=>{
            if(error){
                console.log(error);
            } else {
                return res.render('login',{
                    message: "Thankyou for registering with us. Please Login with your credentials."
                });
            }
        })
    });
}

