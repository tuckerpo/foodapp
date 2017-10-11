var express = require('express');
var mysql = require('mysql');
var app = express();

// var connection = mysql.createConnection({
//     host: process.env.host,
//     user:   process.env.user,
//     password:   process.env.password,
//     database: process.env.database
// })

connection.connect(function(error) {
    if (!!error) { console.log('db not connected'); } else { console.log('db connected'); }
});


const PORT = 3000;

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index.ejs');
});

app.listen(PORT, function() {
    console.log('Server running on port: ' + PORT);
});
