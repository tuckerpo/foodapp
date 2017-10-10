var express = require('express');
var app = express();

const PORT = 3000;

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index.ejs');
});

app.listen(PORT, function() {
    console.log('Server running on port: ' + PORT);
});
