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
// Search Page
app.get('/', (req, res) => {
    res.render('pages/index.ejs');
});

// Results Page
app.get('/results', (req, res) => {
    var zip_code = req.query.zip_code;
    var keyword = req.query.keyword;
    client.search({
        term: keyword,
        location: zip_code
    }).then(response => {
        //console.log(response.jsonBody.businesses);
        res.render('pages/results.ejs', {
            resultList: response.jsonBody.businesses
        });
    });
});

// Individual Restaurants Page
// Lists all events at restaurant
app.get('/events/:id', (req, res) => {

    //TODO: make SQL query here using req.params.id
    // to get list of events

    client.business(req.params.id).then(response => {
        //console.log(response.jsonBody);
        res.render('pages/events.ejs', {
            result : response.jsonBody
        });
    }).catch(e => {
        console.log(e);
    });
});
