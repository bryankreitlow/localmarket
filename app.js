var express = require('express.io'),
    engine = require('ejs-locals');

var app = express().http().io();

app.use("/assets", express.static(__dirname + '/assets'));

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
  res.render('index');
});

app.get('/map', function(req, res){
    res.render('map');
});

app.get('/about', function(req, res){
  res.render('about');
});

app.io.set('log level', 1);

app.listen(80);

console.log('Server running at http://www.localmart.me/');