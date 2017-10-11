var express = require('express');
var mysql = require('mysql');
var app = express();

var connection = mysql.createConnection({
    host: 'localhost',
    user:   'root',
    password:   'YourLocalSQLPwHere',
    database: 'FoodAppTest'
})

connection.connect();


const PORT = 3000;

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index.ejs');
});

app.listen(PORT, function() {
    console.log('Server running on port: ' + PORT);
});
