var express = require('express.io'),
    engine = require('ejs-locals');

var app = express().http().io();

app.use("/assets", express.static(__dirname + '/assets'));

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
    res.render('map', {
    message: 'Hello World'
  });
});

app.io.set('log level', 1);

app.listen(80, "127.0.0.1");

console.log('Server running at http://www.localmart.me/');