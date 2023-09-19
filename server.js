const inquirer = require("inquirer");
const mysql = require("mysql2/promise");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.PASSWORD,
    database: 'Company_db'
  });
  
  connection.connect(err => {
    if (err) throw err;
    console.log('connected!');
    afterConnection();
  });