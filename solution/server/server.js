//load dependencies
const   EXPRESS = require('express'),
        APP = EXPRESS(),
        SERVER = require('http').Server(APP),
        IO = require('socket.io')(SERVER),
        TWIT = require('./twit-manager'),
        LOG = require('./logger');

const LNAME = 'SERVER';

//app-related dependencies
const   PATH = require('path'),
        ROUTES = require('./routes/index');

APP.set('views', PATH.join(__dirname, 'views'));
APP.set('view engine', 'pug');
APP.use(EXPRESS.static(PATH.join(__dirname, 'public')));

//set up routes
APP.use('/', ROUTES);

//set up sockets
IO.on('connection', (socket) => {

    LOG.log(LNAME, 'Socket opened with ID: ' + socket.id);

    socket.on('static-search', (data) => {
        TWIT.search(data, (err, res) => {
            let destination = data.db_only? 'db-search-result' : 'feed-search-result';
            LOG.log(LNAME, 'Returning '+res.tweets.length+' tweets to the client.');
            IO.to(socket.id).emit(destination, err, res);
        });

        TWIT.playerSearch(data, (err, playerName) => {
            IO.to(socket.id).emit('player-found', err, playerName);
        }, (err, playerData) => {
            IO.to(socket.id).emit('player-card-result', err, playerData);
        });
    });

    socket.on('open-stream', (msg) => {
        TWIT.openStream(msg, (err, res) => {
            IO.to(socket.id).emit('stream-result', err, res);
        });
    });

    socket.on('close-stream', () => {
        TWIT.closeStream();
    });

    socket.on('disconnect', () => {
        LOG.log(LNAME, 'Socket closed with ID: ' + socket.id);
    });
});

let port = process.env.PORT || 3333;
SERVER.listen(port, () => {
    LOG.log(LNAME, 'App listening at http://localhost:' + port );
});