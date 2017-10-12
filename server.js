'use strict';

var express = require('express');
var mysql = require('mysql');
var yelp = require('yelp-fusion');
var cache = require('memory-cache');
require('dotenv').config();
var app = express();
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
    console.log('Server running on port: ' + PORT);
});

// -----------DB Setup
// var connection = mysql.createConnection({
//     host: process.env.host,
//     user:   process.env.user,
//     password:   process.env.password,
//     database: process.env.database
// })

//connection.connect(function(error) {
//    if (!!error) { console.log('db not connected'); } else { console.log('db connected'); }
//});

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
