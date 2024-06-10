const mysql = require('mysql2/promise');
require('dotenv').config();

const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

mysqlPool.getConnection()
    .then(async () => {
        console.log('Connected to the database!');
    })
    .catch((err) => {
        console.error('Error connecting to the database:', err.message);
    });

module.exports = mysqlPool;