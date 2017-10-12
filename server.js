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

// ----------------- DB Setup
var connection = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT
  });
  
  connection.connect(function(err) {
    if (!!err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
  
    console.log('Connected to database.');
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
