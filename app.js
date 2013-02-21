var express = require('express.io'),
    engine = require('ejs-locals');

var app = express().http().io();

app.use("/assets", express.static(__dirname + '/assets'));

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set("view options", { layout: "layout.ejs" });
  app.engine('ejs', engine);
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(app.router);
});

app.get('/', function(req, res) {
  res.render('index');
});

app.io.set('log level', 1);

app.listen(80);

console.log('Server running at http://www.localmart.com/');