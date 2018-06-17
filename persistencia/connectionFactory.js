var mysql = require('mysql');

function createDBConnection() {
    return mysql.createConnection({
        //host: 'localhost',
        host: '192.168.100.105',
        user: 'root',
        password: '',
        database: 'payfast'
    });
}

module.exports = function() {
    return createDBConnection;
}
