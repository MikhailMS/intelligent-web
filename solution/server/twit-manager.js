/**
 * twit-manager.js
 *
 * Manages all interaction concerning
 * tweets. Its functions are used in
 * server.js which requests tweets
 * based on queries supplied from the
 * client. twit-manager.js then returns
 * lists of tweets either from the Twitter
 * API or the database. Additionally, it
 * stores and handles past queries.
 *
 * Written by:  Blagoslav Mihaylov
 * Last updated: 21/05/2017
 */

//load dependencies
const   TWIT_API = require('./twit-retriever'),
        DB = require('./db-control'),
        DBP = require('./dbpedia-retriever'),
        LOG = require('./logger');

//how much time (in ms) should have passed before
//results are updated using the Twitter API
const THRESHOLD = 5 * 60 * 1000; //5 minutes

//logging name
const LNAME = 'TWIT';

/**
 * This function tells us whether a given
 * query has not been updated in a while and
 * needs updating.
 *
 * @param query - the query
 * @param callback - receives true/false (needs updating)
 */
function needsUpdating(query, callback) {
    //get the timestamp from the database
    DB.lastUpdated(query, (err, lastUpdated) => {
        //find difference
        let diff = Math.floor(Date.now()) - lastUpdated;
        LOG.log(LNAME, 'Query was last run '+Math.round(diff / 60000)+' minutes ago.');
        //send back true/false whether the difference
        //is higher than the threshold
        callback(err, diff > THRESHOLD);
    });
}

/**
 * Send back tweet response, which should be
 * passed on to the client.
 *
 * @param tweets - list of tweets
 * @param from_db - whether the tweets come from the DB
 * @returns {{tweets: *, frequency: *, from_db: *}}
 */
function tweetResponse(tweets, from_db) {
    LOG.log(LNAME, 'Sorting '+tweets.length+' tweets.');
    tweets.sort((a, b) => b.id - a.id); //sort the tweets by ID
    return {
        tweets: tweets,
        frequency: getFreq(tweets),
        from_db: from_db
    };
}

/**
 * Update the tweets in the database for
 * a given query.
 *
 * @param query - the query
 * @param sendBack - callback; receives list of tweets
 */
function updateTweets(query, sendBack) {
    //get list of tweets using the Twitter API
    TWIT_API.getTweets(query, (err, tweets) => {
        if(err === null) {
            DB.recordTweets(tweets);
            DB.recordQuery(query);
        }
        sendBack(err, tweetResponse(tweets, false));
    });
}

/**
 * Retrieves tweets from database.
 *
 * @param query - raw client query
 * @param sendBack - callback, receives tweet array
 */
function retrieveTweets(query, sendBack) {
    DB.retrieveTweets(query, (err, tweets) => {
        sendBack(err, tweetResponse(tweets, true));
    });
}

/**
 * Search for tweets given a query.
 *
 * @param data - input from client
 * @param sendBack - callback receiving tweets
 */
search = function(data, sendBack) {
    let query = data.query;
    LOG.log(LNAME, 'Search query received: ' + query);

    //if user has specified explicitly
    //that results should be from DB
    if(data.db_only)
        retrieveTweets(query, sendBack);
    else //otherwise see if tweets need to be updated
        needsUpdating(query, (err, needs) => {
            //if threshold has been exceeded, update them
            if (needs) updateTweets(query, sendBack);
            //otherwise retrieve them from the database
            else retrieveTweets(query, sendBack);
        });
};

/**
 * Search for player information using DBPedia.
 *
 * @param data - client input data
 * @param signalPlayerFound - let client know that the player is
 *                         currently being queried for in DBPedia
 * @param sendPlayerData - send data back to client
 */
playerSearch = function(data, signalPlayerFound, sendPlayerData) {
    let query = data.query;
    //use query to find a player match in the database
    DB.findPlayer(query, (err, playerName) => {
        if(err === null) {
            //let client know that a player has been found
            //ans is currently being queried for
            signalPlayerFound(null, playerName);
            DBP.getPlayerData(playerName, (err, player) => {
                LOG.log(LNAME, 'Received player data.');
                sendPlayerData(err, player);
            });
        } else {
            signalPlayerFound(err, null);
        }
    });
};

/**
 * Open a stream given the parameters
 * specified by the user.
 *
 * @param query - the query
 * @param streamBack - callback (receives tweets back one at a time)
 */
openStream = function(query, streamBack) {
    let tokens = DB.tokenize(query);
    let users = '';
    let filter = '';

    //generate filter
    for (let i = 0; i < tokens.keywords.length; i++) {
        let keyword = tokens.keywords[i];

        if (keyword.pre === 'AND') filter += ' ';
        else if (keyword.pre === 'OR') filter += ',';

        filter += keyword.word;
    }

    //convert the user list to an ID list
    TWIT_API.findUserIds(0, users, tokens.users, (userStr) => {
        //initiate the stream
        TWIT_API.openStream(userStr, filter, (err, tweet) => {
            if(err === null) DB.recordTweets([tweet]);
            streamBack(err, tweet);
        });
    });
};

/**
 * Used to close a stream currently in
 * use by the Twitter API.
 */
closeStream = function() {
    TWIT_API.closeStream();
};

/**
 * Returns a dictionary of frequencies
 * for a given set of tweets. Each key is a date,
 * each value is an integer count.
 *
 * @param tweets - list of tweets
 * @returns {{}} - dictionary
 */
function getFreq(tweets) {
     let freq = {};

     for (let i in tweets) {
        let t = tweets[i];
        let y = t.date_time.year;
        let m = t.date_time.month;
        let d = t.date_time.date;

        let key = d + '/' + m + '/' + y;
        //if date has not been used yet, initialize it
        if (freq[key] === undefined) freq[key] = 0;
        freq[key]++; //increment
     }

     return freq;
}

//export functions
module.exports = {
    search,
    playerSearch,
    openStream,
    closeStream,
};