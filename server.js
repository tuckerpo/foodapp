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

app.get('/results', (req, res) => {

    res.render('pages/results.ejs', {
        resultList: dummy
    });
});


const dummy = [ { id: '99-fast-food-buffalo',
    name: '99 Fast Food',
    image_url: 'https://s3-media3.fl.yelpcdn.com/bphoto/vwOnr_5hC_sZiKZ6grJMeA/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/99-fast-food-buffalo?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 231,
    categories: [Array],
    rating: 4,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+17168366058',
    display_phone: '(716) 836-6058',
    distance: 1437.6542810945 },
  { id: 'oyishi-japan-buffalo',
    name: 'Oyishi Japan',
    image_url: 'https://s3-media3.fl.yelpcdn.com/bphoto/VvLrw-Ox7qctSGlxd6ZTLQ/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/oyishi-japan-buffalo?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 10,
    categories: [Array],
    rating: 3.5,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+17166835642',
    display_phone: '(716) 683-5642',
    distance: 4404.241981479686 },
  { id: 'sushi-time-getzville',
    name: 'Sushi Time',
    image_url: 'https://s3-media2.fl.yelpcdn.com/bphoto/0WccE2budOTMv8-9otvj2w/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/sushi-time-getzville?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 63,
    categories: [Array],
    rating: 4,
    coordinates: [Object],
    transactions: [Array],
    price: '$',
    location: [Object],
    phone: '+17169327357',
    display_phone: '(716) 932-7357',
    distance: 9219.904729307022 },
  { id: 'tea-leaf-cafe-amherst',
    name: 'Tea Leaf Cafe',
    image_url: 'https://s3-media2.fl.yelpcdn.com/bphoto/sk0nhsTJibeJ2WX7uMDXQw/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/tea-leaf-cafe-amherst?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 172,
    categories: [Array],
    rating: 4,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+17168318202',
    display_phone: '(716) 831-8202',
    distance: 6268.905890049257 },
  { id: 'dancing-chopsticks-buffalo',
    name: 'Dancing Chopsticks',
    image_url: 'https://s3-media2.fl.yelpcdn.com/bphoto/dZqM08Aii6cJj4-l6yKu4w/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/dancing-chopsticks-buffalo?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 30,
    categories: [Array],
    rating: 3.5,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+17166888885',
    display_phone: '(716) 688-8885',
    distance: 7567.414311983335 },
  { id: 'japanese-restaurant-yukiguni-2-fort-erie',
    name: 'Japanese Restaurant Yukiguni 2',
    image_url: 'https://s3-media3.fl.yelpcdn.com/bphoto/8dnrCP7kz_sFeBZqkDctUA/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/japanese-restaurant-yukiguni-2-fort-erie?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 7,
    categories: [Array],
    rating: 3.5,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+19059948506',
    display_phone: '+1 905-994-8506',
    distance: 11339.529813280215 },
  { id: 'korean-express-amherst',
    name: 'Korean Express',
    image_url: 'https://s3-media1.fl.yelpcdn.com/bphoto/X3UE2pIf1Hw6qJyLwxmogg/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/korean-express-amherst?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 35,
    categories: [Array],
    rating: 3.5,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+17166886816',
    display_phone: '(716) 688-6816',
    distance: 7567.414311983335 },
  { id: '007-chinese-food-buffalo',
    name: '007 Chinese Food',
    image_url: 'https://s3-media2.fl.yelpcdn.com/bphoto/WgaVksAEmR9B8rPll0Qh7w/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/007-chinese-food-buffalo?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 16,
    categories: [Array],
    rating: 4.5,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '',
    display_phone: '',
    distance: 7212.649822655192 },
  { id: 'peking-quick-one-tonawanda',
    name: 'Peking Quick One',
    image_url: 'https://s3-media4.fl.yelpcdn.com/bphoto/zFrG-VOG52TpiNAIR5YsMQ/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/peking-quick-one-tonawanda?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 108,
    categories: [Array],
    rating: 4.5,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+17163818730',
    display_phone: '(716) 381-8730',
    distance: 6601.146792688583 },
  { id: 'seoul-garden-tonawanda',
    name: 'Seoul Garden',
    image_url: 'https://s3-media2.fl.yelpcdn.com/bphoto/n8PCJXbRzpXgI3DwmVPYYA/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/seoul-garden-tonawanda?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 45,
    categories: [Array],
    rating: 4,
    coordinates: [Object],
    transactions: [],
    price: '$',
    location: [Object],
    phone: '+17166923888',
    display_phone: '(716) 692-3888',
    distance: 9134.550641057265 },
  { id: 'taste-of-china-tonawanda',
    name: 'Taste of China',
    image_url: 'https://s3-media4.fl.yelpcdn.com/bphoto/odIsygqU1O-d97mWEkyP6w/o.jpg',
    is_closed: false,
    url: 'https://www.yelp.com/biz/taste-of-china-tonawanda?adjust_creative=SF5aQqjn2JCgXlK8zSVaCQ&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=SF5aQqjn2JCgXlK8zSVaCQ',
    review_count: 2,
    categories: [Array],
    rating: 4,
    coordinates: [Object],
    transactions: [Array],
    price: '$',
    location: [Object],
    phone: '+17168336668',
    display_phone: '(716) 833-6668',
    distance: 11166.185841704095 } ];
