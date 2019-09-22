'use strict';

const express = require('express');
const request = require('request');
const mysql = require('mysql');
const yelp = require('yelp-fusion');
const cache = require('memory-cache');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs');
const session = require('express-session')
const moment = require('moment');
require('dotenv').config();
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log('Server running on port: ' + PORT);
});

app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    cookieName: 'FoodAppSession',
    secret: 'kjhfiuFaskHJDKJHFyr982yrqwcuyrig;;1981*&(*$&#*&29',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    saveUninitialized: true,
    resave: true
}));

// ----------------- DB Setup
var connection = mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE
});

connection.connect(function (err) {
    if (!!err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

// -----------Yelp-Fusion API Setup
// TJP -- Yelp API 3.0 switched from OAuth2 to just API keys, ID & Secret are deprecated
const yelp_api_key = process.env.FOODAPP_YELP_API_KEY;
const client = yelp.client(yelp_api_key);

// -----------Middleware
function requireLogin(req, res, next) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        next();
    }
};

app.use(function (req, res, next) {
    if (req.session && req.session.user) {
        connection.query("SELECT id, accountName FROM `foodapp`.`account` WHERE accountName= ?", [req.session.user], function (err, result, fields) {
            if (result != '[]') {
                req.user = result[0].accountName;
                delete req.user.password; // delete the password from the session
                req.session.user = result[0].accountName;  //refresh the session value
                req.session.userId = result[0].id;
                res.locals.user = result[0].accountName;
            }
            // finishing processing the middleware and run the route
            next();
        });
    } else {
        next();
    }
});

//-----------Routes
app.get('/', requireLogin, (req, res) => {
    res.render('pages/index.ejs', {
        username: req.session.user
    });
});

app.get('/logout', requireLogin, (req, res) => {
    req.session.destroy();
    res.render('pages/logout.ejs');
})

app.get('/results', requireLogin, (req, res) => {
    var zip_code = req.query.zip_code;
    var keyword = req.query.keyword;
    if(req.query.zip_code.length) {
        client.search({
            term: keyword,
            location: zip_code
        }).then(response => {
            //console.log(response.jsonBody.businesses);
            if(!response) {
                res.redirect('/');
            }
            res.render('pages/results.ejs', {
                resultList: response.jsonBody.businesses
            });
        }).catch(e => {
            throw new Error(err);
            console.log(e);
        })
    }
    else {
        res.redirect('/');
    }
});

app.get('/events/:id', requireLogin, (req, res) => {
    var eventList;
    var attendees = [];
    var query = 'SELECT * FROM foodapp.event ' +
        'WHERE location=? ' +
        'ORDER BY event_time DESC';
    connection.query(query, [req.params.id], function (error, results) {
        if (error) {
            console.log(error);
            return;
        }
        eventList = results;
        var eventListIDs = [];
        for (var i = 0; i < eventList.length; i++) {
            eventListIDs.push(eventList[i].event_id);
            var date = moment(eventList[i].event_time).format("LLLL").replace(',', '').split(' ');
            eventList[i].event_time = date;
        }
        if (eventListIDs.length != 0) {
            query = 'SELECT accountName, foodapp.eventAttend.event_id ' +
                'FROM foodapp.account ' +
                'JOIN eventAttend ON foodapp.eventAttend.user_id = account.id ' +
                'WHERE event_id IN (?)';
        } else {
            query = 'SELECT' + " 'ID' " + 'LIMIT 0';
        }
        connection.query(query, [eventListIDs], function (error, results) {
            if (error) {
                console.log(error);
                return;
            }
            for (var i = 0; i < eventList.length; i++) {
                var temp = results.filter(function (at) {
                    return at.event_id == eventList[i].event_id;
                });
                attendees.push(temp);
            }
            client.business(req.params.id).then(response => {
                res.render('pages/events.ejs', {
                    result: response.jsonBody,
                    location: req.params.id,
                    eventList: eventList,
                    attendees: attendees,
                    userId: req.session.userId,
                    username: req.session.user
                });
            }).catch(e => {
		throw new Error(err);
                console.log(e);
            });
        });
    });
});

app.post('/addEvent', requireLogin, (req, res) => {
    if(!req.body.date) {
        // console.log(req.header('Referer') || '/')
        var prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
        return;
    }
    var date = moment(new Date(req.body.date)).format("YYYY-MM-DD HH:mm:ss");
    var location = req.body.location;
    var query = "INSERT INTO event (location, event_time) " +
        "VALUES (?, ?)";
    connection.query(query, [location, date], function (error, results) {
        if (error) console.log(error);
        var prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
    });
});

app.post('/attendEvent', requireLogin, (req, res) => {
    var id = req.body.id;
    var eventId = req.body.eventId;
    var query = "SELECT * FROM eventAttend " +
                "WHERE user_id=? AND event_id=?";
    connection.query(query, [id, eventId], function (error, results) {
        if (error) console.log(error);
        if(results.length == 0) {
            // Insert into db
            query = "INSERT IGNORE INTO eventAttend (user_id, event_id) " +
                "VALUES (?, ?)";
        } else {
            // Remove from db
            query = "DELETE FROM eventAttend " +
                "WHERE user_id=? AND event_id=?";
        }
        connection.query(query, [id, eventId], function (error, results) {
            if (error) console.log(error);
            res.send(req.body);
        });
    });
});

app.get('/login', (req, res) => {
    res.render('pages/login.ejs');
});

app.get('/register', (req, res) => {
    res.render('pages/register.ejs', {duperr: 'false'});
});

app.get('/about', (req, res) => {
    res.render('pages/about.ejs');
});

app.get('/zipcode', (req, res) => { 
    var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+
                req.query.lat+","+req.query.long+
                "&key="+process.env.GEOCODING_API_KEY;
    request(url, function(error, response, body) {
        if(error) console.log(error);
        
        var json = JSON.parse(body);
        var addr_comp = json['results'][0]['address_components'];
        var zipcode;
        for(var i = 0; i < addr_comp.length; i++) {
            if(addr_comp[i]['types'][0] == 'postal_code') {
                zipcode = addr_comp[i]['short_name'];
            }
        }
        if(zipcode) {
            res.send(zipcode);
        }
    });
});

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.pw;
    const email = req.body.email;
    const pw2 = req.body.pw2;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.pw, salt);

    // Validate fields
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('email', 'Valid email required').isEmail();
    req.checkBody('pw', 'Password is required').notEmpty();
    req.checkBody('pw2', 'Passwords don\'t match!').equals(req.body.pw);
    var error = req.validationErrors()
    if (error) {
        console.log('Register form input: ' + error);
        res.render('pages/register.ejs', {duperr: 'false'});
    } else {
        var q = connection.query("INSERT INTO foodapp.account (accountName, email, password) VALUES (?,?,?)", 
                        [username, email, hash], function (err, result, fields) {
            if (err) { 
                console.log("Database query failed: " + err.code);
                res.render('pages/register.ejs', {duperr: 'true'});
            }
            else {
                req.session.user = username;
                res.redirect('/');
            }
        });
        q.on('error', function() {
            console.log('Duplicate account attempted registration');
        });
    }
});

app.post('/login', (req, res) => {
    var holder = [];
    var loadUser = req.body.username;
    var loadPw = req.body.password;
    var err = req.validationErrors()
    if (err) {
        console.log('input errors');
        res.render('pages/login.ejs');
    } else {
    connection.query("SELECT accountName, password FROM `foodapp`.`account` WHERE accountName= ?", [loadUser], function (err, result, fields) {
        if (!!err) {
            console.log("DB query err: " + err.stack);
        }
        else {
            holder = result;
            if(!holder[0]) {
                res.render('pages/login.ejs');
            }
            else if (bcrypt.compareSync(loadPw, holder[0].password)) {
                req.session.user = loadUser;
                res.redirect('/');
            } else {
                res.render('pages/login.ejs');
            }

        }
    })
}}
);
