//load dependencies
var express = require('express');
var Twitter = require('twitter');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var twitHandler = require('./twit-handler');
var port = process.env.PORT || 3333;
server.listen(port, function () {
    console.log('App listening at http://localhost:' + port)
});

//app-related dependencies
var path = require('path');
var routes = require('./routes/index');
var favicon = require('serve-favicon');
// var logger = require('morgan');
// var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');

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
io.on('connection', function (socket) {
    console.log('Socket opened. ID: ' + socket.id);
    socket.on('search-query', function (msg) {
        console.log('Search Query received:', msg);
        twitHandler.querySearch(msg, function (res) {
            io.to(socket.id).emit('search-result', res);
        });
    });

    socket.on('stream-query', function (msg) {
        console.log('stream starting');
        twitHandler.queryStream(msg, function (res, stream) {
            io.to(socket.id).emit('stream-result', res);
            socket.on('close-stream', (res => {
                stream.destroy(); // close stream
            }));
        });
    });

    socket.on('disconnect', function () {
        console.log('Socket closed. ID: ' + socket.id);
    });
});
