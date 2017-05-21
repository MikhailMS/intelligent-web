/**
 * server.js
 *
 * Represents the main file of the server
 * backend. Initializes and starts an
 * express.js server. Additionally, defines
 * the sockets and handles any communication
 * through them. Queries are received through
 * the sockets, which are then used to provide
 * output to the client.
 *
 * Written by:  Blagoslav Mihaylov,
 *              Petar Barzev,
 *              Mikhail Molotkov
 * Last updated: 21/05/2017
 */

//load dependencies
const EXPRESS = require('express'),
    APP = EXPRESS(),
    SERVER = require('http').Server(APP),
    IO = require('socket.io')(SERVER),
    TWIT = require('./twit-manager'),
    LOG = require('./logger');

const LNAME = 'SERVER'; //name used for logging

//app-related dependencies
const PATH = require('path'),
    ROUTES = require('./routes/index');

APP.set('views', PATH.join(__dirname, 'views'));
APP.set('view engine', 'pug');
APP.use(EXPRESS.static(PATH.join(__dirname, 'public')));

//set up routes
APP.use('/', ROUTES);

//set up sockets
IO.on('connection', (socket) => {
    LOG.log(LNAME, `Socket opened with ID: ${socket.id}`);

    //used when receiving search queries
    socket.on('static-search', (data) => {
        //get search results from the twit manager
        //it will either use the API or the database
        TWIT.search(data, (err, res) => {
            const destination = data.db_only ? 'db-search-result' : 'feed-search-result';
            LOG.log(LNAME, `Returning ${res.tweets.length} tweets to the client.`);
            //send back list of tweets
            IO.to(socket.id).emit(destination, err, res);
        });

        //get data on players from DBPedia
        TWIT.playerSearch(data, (err, playerName) => {
            //signal client that player is being queried to DBPedia
            IO.to(socket.id).emit('player-found', err, playerName);
        }, (err, playerData) => {
            //send back player data
            IO.to(socket.id).emit('player-card-result', err, playerData);
        });
    });

    //initiate a stream using the specified query
    socket.on('open-stream', (msg) => {
        TWIT.openStream(msg, (err, res) => {
            IO.to(socket.id).emit('stream-result', err, res);
        });
    });

    //close the stream
    socket.on('close-stream', () => {
        TWIT.closeStream();
    });

    //when client has disconnected
    socket.on('disconnect', () => {
        LOG.log(LNAME, `Socket closed with ID: ${socket.id}`);
    });
});

//initialize server
const port = process.env.PORT || 3333;
SERVER.listen(port, () => {
    LOG.log(LNAME, `App listening at http://localhost:${port}`);
});
