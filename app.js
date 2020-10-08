var express = require('express');
var compression = require('compression')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var SessionStore = require('express-mysql-session');
var loadUser = require('./middleware/loadUser');
var dbCheckConnection = require('./middleware/dbCheckConnection');


var app = express();
/*if (app.get('env') === 'development') {
  global.db_config = require('./config/db_mysql');
} else {
  global.db_config = require('./config/db_postgres');
}*/
//global.db_config = require('./config/db_postgres');
global.db_config = require('./config/db_mysql');
global.db = require('./lib/db');

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
// compress all requests
app.use(compression());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(dbCheckConnection);

app.use(session({
  secret: 'DFHf$FGR785#$#$HFDH%675',
  resave: true,
  saveUninitialized: false,
  store: new SessionStore(global.db_config),
  secure : true
}));
app.use(loadUser);

app.use('/', require('./routes/main'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
