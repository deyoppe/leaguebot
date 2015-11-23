var express = require('express'),
    hbs  = require('hbs'),
    path = require('path');

var app = express();

app.engine('hbs', require('hbs').__express);
app.set('view engine', 'hbs');
app.use('/assets', express.static('views/assets'));
var partsPath = path.join(__dirname, '..', 'views', 'partials');
hbs.registerPartials(partsPath);

app.get('/recent', function (req, res) {
    res.render('tpl/recent');
});

app.listen(3000, function () {
    console.log('express-handlebars example server listening on: 3000');
});