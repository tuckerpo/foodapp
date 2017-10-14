'use strict';

var express = require('express');
var mysql = require('mysql');
var yelp = require('yelp-fusion');
var cache = require('memory-cache');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser')
var bcrypt = require('bcryptjs');
var session = require('express-session')
require('dotenv').config();
var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

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
    FOREIGN KEY(event_id) REFERENCES foodapp.event(event_id))", function (err, result, fields) {
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
            result: response.jsonBody
        });
    }).catch(e => {
        console.log(e);
    });
});


app.get('/login', (req, res) => {
    res.render('pages/login.ejs');
});

app.get('/register', (req, res) => {
    res.render('pages/register.ejs');
})


// get registration input
app.post('/register', (req, res) => {

    var username = req.body.username;
    var password = req.body.pw;
    var email = req.body.email;
    var pw2 = req.body.pw2;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.pw, salt);
    console.log('hashed and salted ' + hash);

    // make sure fields aren't filled with bullshit
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('email', 'Valid email required').isEmail();
    req.checkBody('pw', 'Password is required').notEmpty();
    req.checkBody('pw2', 'Passwords don\'t match!').equals(req.body.pw);
    var err = req.validationErrors()
    if (err) {
        console.log('input errors');
        res.render('pages/register.ejs');
    } else {
        console.log('no errors');
        // if there were no input errors, register them in the DB
        // or check if they already are
        // if succesfully registered, send splash success page, route back to home
        // if already in, route back to homepage
        connection.query("INSERT IGNORE INTO foodapp.account (accountName, email, password) VALUES (?,?,?)", [username, email, hash]), function (err, result, fields) {
            if (err) { console.log(err.stack); }
            else {
                console.log(result);
            }
        }
    }
    
});
       
// dont let anyone sniff your packets   

// use bcrypt for hash

