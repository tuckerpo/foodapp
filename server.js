'use strict';

var express = require('express');
var mysql = require('mysql');
var yelp = require('yelp-fusion');
var cache = require('memory-cache');
var bodyParser = require('body-parser')
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
    port     : process.env.RDS_PORT,
    database : process.env.RDS_DATABASE
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
    var eventList;
    var attendees = [];
    var query = 'SELECT * FROM foodapp.event '+
                'WHERE location=? ' +
                'ORDER BY event_time DESC';
    connection.query(query, [req.params.id], function(error, results) {
        if(error) {
            console.log(error);
            return;
        }
        eventList = results;
        var eventListIDs = [];
        for(var i = 0; i < eventList.length; i++) {
            eventListIDs.push(eventList[i].event_id);
        }
        query = 'SELECT accountName, eventAttend.event_id '+
                'FROM account '+
                'JOIN eventAttend ON eventAttend.user_id = account.id '+
                'WHERE event_id IN (?)';
        connection.query(query, [eventListIDs], function(error, results) {
            if(error) {
                console.log(error);
                return;
            }
            var t = JSON.parse(JSON.stringify(results));
            for(var i = 0; i < eventList.length; i++) {
                console.log(t);
                var temp = t.filter(function(at) {
                    at.event_id == eventList[i].event_id
                });
                // console.log(temp);
                attendees.push.apply(temp);
            }
            console.log(attendees);
            client.business(req.params.id).then(response => {
                //console.log(response.jsonBody);
                //console.log(eventList);
                // console.log(attendees);
                res.render('pages/events.ejs', {
                    result : response.jsonBody,
                    eventList : eventList,
                    attendees : attendees
                });
            }).catch(e => {
                console.log(e);
            });
        });
    });
});


app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/login', (req, res) => {
    res.render('pages/login.ejs');
});

app.get('/register', (req, res) => {
    res.render('pages/register.ejs');
});
