// =======================
// Get the packages ====================
// =======================
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var twitter = require('twitter'); // Twitter API package
var config = require('./config'); // Get config

// =======================
// Set up server =======================
// =======================
var http = require('http').Server(app); // Create server on top of express app
var io = require('socket.io').listen(http); // Connect Socket.IO to that server

// =======================
// Get the routers =====================
// =======================
var routes = require('./routes/index');

// =======================
// Set up Twitter API ==================
// =======================
var twit = new twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
}),
stream = null;

// =======================
// Application configuration ===========
// =======================
var port = process.env.PORT || 3333 //set up server port

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// Setting up routes ===================
// =======================
app.use('/', routes);


// =======================
// Error handlers ======================
// =======================
app.use(function(req, res, next) { // Catch 404 and forward to error handler
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


if (app.get('env') === 'development') { // Development error handler will print stacktrace
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
app.use(function(err, req, res, next) { // Production error handler no stacktraces leaked to user
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// =======================
// Emit twitter data ===================
// =======================
io.sockets.on('connection', function (socket) {

  socket.on("start tweets", function() {

    if(stream === null) {
      // Connect to twitter stream passing in filter for entire world.
      twit.stream('statuses/filter', {'locations':'-180,-90,180,90'}, function(stream) {
          stream.on('data', function(data) {

              var text = null;

              if (data.text) {
                text = data.text;
              }
              // Create JSON object that would be send to client
              var tweetData = {"msg": text};

              // Send data to client
              socket.broadcast.emit("twitter-stream", tweetData);
              socket.emit('twitter-stream', tweetData);

              stream.on('limit', function(limitMessage) {
                return console.log(limitMessage);
              });

              stream.on('warning', function(warning) {
                return console.log(warning);
              });

              stream.on('disconnect', function(disconnectMessage) {
                return console.log(disconnectMessage);
              });
          });
      });
    }
  });
  // Emits signal to the client telling them that the
  // they are connected and can start receiving Tweets
  socket.emit("connected");
});

// =======================
// Start an application ================
// =======================
http.listen(port, function(){
 console.log('App listening at http://localhost:'+port);
});

//module.exports = app;
