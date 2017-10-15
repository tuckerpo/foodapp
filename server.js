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

app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

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
        if(eventListIDs.length != 0) {
            query = 'SELECT accountName, eventAttend.event_id '+
                    'FROM account '+
                    'JOIN eventAttend ON eventAttend.user_id = account.id '+
                    'WHERE event_id IN (?)';
        } else {
            query = 'SELECT' + " 'ID' " + 'LIMIT 0';
        }
        connection.query(query, [eventListIDs], function(error, results) {
            if(error) {
                console.log(error);
                return;
            }
            for(var i = 0; i < eventList.length; i++) {
                var temp = results.filter(function(at) {
                    return at.event_id == eventList[i].event_id;
                });
                attendees.push(temp);
            }
            client.business(req.params.id).then(response => {
                res.render('pages/events.ejs', {
                    result : response.jsonBody,
                    location: req.params.id,
                    eventList : eventList,
                    attendees : attendees
                });
            }).catch(e => {
                console.log(e);
            });
        });
    });
});

app.post('/addEvent', (req, res) => {
    var date = new Date(req.body.date).toISOString().replace('T', ' ').slice(0,19);
    var location = req.body.location;
    var query = "INSERT INTO event (location, event_time) "+
                "VALUES ('" + location + "', '" + date + "')";
    connection.query(query, function(error, results) {
        if(error) console.log(error);
        var prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
    });

});



app.get('/login', (req, res) => {
    res.render('pages/login.ejs');
});

app.get('/register', (req, res) => {
    res.render('pages/register.ejs');
});
