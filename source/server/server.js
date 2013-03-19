/*jslint node:true, es5:true */

var express = require('express.io'),
    engine = require('ejs-locals');

var app = express().http().io();

var stateList = require('./../../components/StateList');

app.use("/assets", express.static('../../static/assets'));

//Fav icon
app.use(express.favicon(__dirname + '/favicon/favicon.ico', { maxAge: 2592000000 }));

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set("view options", { layout: "layout.ejs" });
  app.engine('ejs', engine);
  app.set('message', 'Hello World')
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(app.router);
});

app.get('/', function(req, res) {
  res.render('index', { page: 'home' });
});

app.get('/mapNew', function(req, res){
  res.render('googleMap', { page: 'map' });
});

app.get('/map', function(req, res){
    res.render('map', { page: 'map' });
});
app.get('/map/', function(req, res){
  res.render('map', { page: 'map' });
});

app.get('/map/:state', function(req, res){
  var state = req.params.state;
  var stateName = stateList[state];
  if(stateName === undefined ) {
    res.send(403, 'Sorry! This does not appear to be a valid state.');
  } else {
    res.render('state', { page: 'map', state: stateName });
  }
});

app.get('/about', function(req, res){
  res.render('about', { page: 'about' });
});

app.io.set('log level', 1);

app.listen(80);

console.log('Server running at http://www.localmart.me/');