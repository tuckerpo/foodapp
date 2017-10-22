'use strict';

var express = require('express');
var mysql = require('mysql');
var yelp = require('yelp-fusion');
var cache = require('memory-cache');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser')
var bcrypt = require('bcryptjs');
var session = require('express-session')
var moment = require('moment');
require('dotenv').config();
var app = express();
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
    port: process.env.RDS_PORT,
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

// middleware function for session checks
function requireLogin(req, res, next) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        next();
    }
};


// more sessions middleware
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
//Search Page
app.get('/', requireLogin, (req, res) => {

    res.render('pages/index.ejs', {
        username: req.session.user
    });
});

app.get('/logout', requireLogin, (req, res) => {
    req.session.destroy();
    res.render('pages/logout.ejs');
})
// Results Page
app.get('/results', requireLogin, (req, res) => {
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
            query = 'SELECT accountName, eventAttend.event_id ' +
                'FROM account ' +
                'JOIN eventAttend ON eventAttend.user_id = account.id ' +
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
                console.log(e);
            });
        });
    });
});

app.post('/addEvent', requireLogin, (req, res) => {
    var date = moment(new Date(req.body.date)).format("YYYY-MM-DD HH:mm:ss");
    var location = req.body.location;
    var query = "INSERT INTO event (location, event_time) " +
        "VALUES ('" + location + "', '" + date + "')";
    connection.query(query, function (error, results) {
        if (error) console.log(error);
        var prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
    });

});

app.post('/attendEvent', requireLogin, (req, res) => {
    var id = req.body.id;
    var eventId = req.body.eventId;
    var query = "SELECT * FROM eventAttend " +
                "WHERE user_id=" + id + " AND event_id=" + eventId;
    var query2 = "INSERT INTO eventAttend (user_id, event_id) " +
        "VALUES ('" + id + "', '" + eventId + "')";
    connection.query(query, function (error, results) {
        if (error) console.log(error);
        if(results.length == 0) {
            // Insert into db
            query = "INSERT INTO eventAttend (user_id, event_id) " +
                "VALUES ('" + id + "', '" + eventId + "')";
        } else {
            // Remove from db
            query = "DELETE FROM eventAttend " +
                "WHERE user_id=" + id + " AND event_id=" + eventId;
        }
        connection.query(query, function (error, results) {
            if (error) console.log(error);
            res.send(req.body);
        });
    });


})/

app.get('/login', (req, res) => {
    res.render('pages/login.ejs');
});

app.get('/register', (req, res) => {
    res.render('pages/register.ejs');
});


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
                // console.log(result);
                res.render('pages/index');
            }
        }
    }

});

app.post('/login', (req, res) => {
    var holder = [];
    var loadUser = req.body.username;
    var loadPw = req.body.password;
    connection.query("SELECT accountName, password FROM `foodapp`.`account` WHERE accountName= ?", [loadUser], function (err, result, fields) {
        if (!!err) { console.log(err.stack); }
        else {
            // successful query
            holder = result;
            if (bcrypt.compare(loadPw, holder[0].password)) {
                //if pw is correct
                req.session.user = loadUser;
                console.log('right password!');
                res.render('pages/index');
            } else {
                //wrong pw
                res.send({
                    "code": 401
                });
            }

        }
    })
});
