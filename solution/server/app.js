//load dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var twitHandler = require('./twit-handler');

//app-related dependencies
var path = require('path');
var routes = require('./routes/index');
var favicon = require('serve-favicon');
// var logger = require('morgan');
// var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');

//configure application
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//set up routes
app.use('/', routes)

//set up sockets
io.on('connection', function(socket){
    console.log('Socket opened. ID: ' + socket.id);

    socket.on('search-query', function(msg) {
        twitHandler.querySearch(msg, function(res) {
            io.to(socket.id).emit('search-result', res);
        });
    });

    socket.on('stream-query', function(msg) {
       twitHandler.queryStream(msg, function(res) {
          io.to(socket.id).emit('stream-result', res);
       });
    });

    socket.on('disconnect', function() {
        console.log('Socket closed. ID: ' + socket.id);
    });
});

//start server
var port = process.env.PORT || 3333;
http.listen(port, function() {
  console.log('App listening at http://localhost:' + port)
});



// io.on('connection', function (socket) {
//   socket.on('client-query', function (payload) {
//
//     var _payload = payload,
//       playerQuery = _payload.playerQuery,
//       teamQuery = _payload.teamQuery,
//       authorQuery = _payload.authorQuery,
//       toggle1 = _payload.toggle1,
//       toggle2 = _payload.toggle2;
//     console.log('app.js received payload:', _payload);
//
//     // process every query type
//     var playerQueryList = playerQuery.split(' OR ');
//     var teamQueryList = teamQuery.split(' OR ');
//     var authorQueryList = authorQuery.split(' OR ');
//
//     console.log('playerQueryList', playerQueryList);
//     console.log('teamQueryList', teamQueryList);
//     console.log('authorQueryList', authorQueryList);
//
//     var playerFilter = runSearchFilter((playerQueryList));
//     var teamFilter = runSearchFilter((teamQueryList));
//     var authorFilter = runSearchFilter((authorQueryList));
//
//     console.log('playerFilter', playerFilter);
//     console.log('teamFilter', teamFilter);
//     console.log('authorFilter', authorFilter);
//
//     runSearch(socket, playerQuery, playerFilter, teamFilter, authorQueryList, toggle1, toggle2);
//     // runStream(socket, playerFilter, teamFilter, authorQueryList, toggle1, toggle2);
//
//     // //////////////// TWITTER SEARCH TEST///////////////////
//     // ///////////// Authors of tweets TEST /////////////////
//     // var users = { screen_name: '@WayneRooney' };
//     // twit.get('statuses/user_timeline', users, function(error, tweets, response) {
//     //   if (!error) {
//     //     console.log(tweets);
//     //   }
//     // });
//
//   });
//   // Emits signal to the client telling them that the
//   // they are connected and can start receiving Tweets
//   socket.emit("connected");
// });

/**
 * Generate and emit a search socket
 * @param {*} socket 
 * @param {*} playerFilter 
 * @param {*} teamFilter 
 * @param {*} authorQueryList 
 * @param {*} toggle1 
 * @param {*} toggle2 
 */
// function runSearch(socket, playerQuery, playerFilter, teamFilter, authorQueryList, toggle1, toggle2) {
//
//   // // gen team / players filter
//   // if (toggle1 === 'OR' && playerFilter !== '' && teamFilter !== '') var filter = playerFilter + ',' + teamFilter;
//   // else filter = playerFilter + ' ' + teamFilter;
//
//   // filter = filter.replace(/,/g, ", "); // refactor filter to match twitter get query format - add spaces
//   // console.log('generated search Filter', filter);
//
//   twit.get('search/tweets', { q: playerQuery, lang: "en", count: 100 }, function (error, tweets, response) {
//     // console.log('generatedDataSearch', tweets);
//     // Send data to client
//     socket.emit("twitterSearch", tweets);
//   });
// };

/**
 * Generate and emit a stream socket
 * @param {*} socket 
 * @param {*} playerFilter 
 * @param {*} teamFilter 
 * @param {*} authorQueryList 
 * @param {*} toggle1 
 * @param {*} toggle2 
 */
// var runStream = function genUserData(socket, playerFilter, teamFilter, authorQueryList, toggle1, toggle2) {
//
//   var playerQueryList = playerFilter.split(' ');
//   var teamQueryList = teamFilter.split(' ');
//
//   var playerStreamFilter = runSearchFilter((playerQueryList));
//   var teamStreamFilter = runSearchFilter((teamQueryList));
//
//   // gen team / players filter
//   if (toggle1 === 'OR' && playerStreamFilter !== '' && teamStreamFilter !== '') {
//     var filter = playerStreamFilter + ',' + teamStreamFilter;
//   }
//   else filter = playerStreamFilter + ' ' + teamStreamFilter;
//
//   console.log('generated stream Filter', filter);
//
//   // initiate stream
//   if (stream === null) {
//     // Connect to twitter stream passing in filter for entire world.
//     twit.stream('statuses/filter', { track: filter }, function (stream) {
//       stream.on('data', function (tweets) {
//         console.log('generatedDataStream', tweets);
//         // Send data to client
//         io.sockets.emit("twitterStream", tweets);
//       });
//     });
//   }
// };


// var runSearchFilter = function runSearchFilter(queryList) {
//   var numEl = 0;
//   var filter = '';
//   queryList.forEach(function (el) {
//     if (queryList.length > 1 && numEl >= 1) filter = filter + ("," + el);
//     else filter = el;
//     numEl++;
//   });
//
//   return filter;
// };

// TODO: Implement author filtering for both SEARCH and STREAMING