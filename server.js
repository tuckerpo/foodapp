'use strict';

var express = require('express');
var mysql = require('mysql');
var yelp = require('yelp-fusion');
var cache = require('memory-cache');
require('dotenv').config();
var app = express();
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log('Server running on port: ' + PORT);
});

// ----------------- DB Setup
var connection = mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT
});

connection.connect(function (err) {
    if (!!err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});


connection.query("CREATE DATABASE IF NOT EXISTS foodapp", function (err, result, fields) {
    if (err) { console.log(err.stack); }
    console.log(result);
});

connection.query("CREATE TABLE IF NOT EXISTS foodapp.account(id INT NOT NULL AUTO_INCREMENT,\
    accountName VARCHAR(255), email VARCHAR(255), PRIMARY KEY (id)) ENGINE=InnoDB", function (err, result, fields) {
        if (err) { console.log(err.stack); }
        console.log(result);
    });

connection.query("CREATE TABLE IF NOT EXISTS foodapp.event(event_id INT NOT NULL AUTO_INCREMENT,\
    location VARCHAR(255), event_time DATETIME, PRIMARY KEY (event_id)) ENGINE=InnoDB", function (err, result, fields) {
        if (err) { console.log(err.stack); }
        console.log(result);
    });

connection.query("CREATE TABLE IF NOT EXISTS foodapp.eventAttend\
    (id INT NOT NULL AUTO_INCREMENT,\
    user_id INT NOT NULL,\
    event_id INT NOT NULL,\
    PRIMARY KEY(id),\
    FOREIGN KEY(user_id) REFERENCES foodapp.account(id),\
    FOREIGN KEY(event_id) REFERENCES foodapp.event(event_id))", function(err,result,fields) {
        if (err) { console.log(err.stack); }
        console.log(result);
    });





// -----------Yelp-Fusion API Setup
var client;
var token = cache.get('token') || yelp.accessToken(process.env.YELPID, process.env.YELPSECRET)
    .then(res => {
        cache.put('token', res.jsonBody.access_token);
    }).catch(e => {
        console.log(e);
    }).then(res => {
        client = yelp.client(cache.get('token'));
    }).catch(e => {
        console.log(e);
    })

// -----------Routes
app.get('/', (req, res) => {
    res.render('pages/index.ejs');

    /*
    // Example API Call, uncomment to see results
        client.search({
            term:'japanese',
            categories: 'food,restaurants',
            location: '14215',
            price: '1'
        }).then(res => {
            console.log(res.jsonBody);
            var businesses = res.jsonBody.businesses;
            for(var i = 0; i < businesses.length; i++) {
                console.log(businesses[i].name);
            }
        }).catch(e => {
            console.log(e);
        });
    */
});

