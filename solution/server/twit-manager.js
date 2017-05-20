/**
 * Created by blagoslav on 19.05.17.
 */

const   TWIT_API = require('./twit-retriever'),
        DB = require('./db-control'),
        DBP = require('./dbpedia-retriever'),
        LOG = require('./logger');

const THRESHOLD = 5 * 60 * 1000; //5 minutes
const LNAME = 'TWIT';

function needsUpdating(query, callback) {
    DB.lastUpdated(query, (err, lastUpdated) => {
        let diff = Math.floor(Date.now()) - lastUpdated;
        LOG.log(LNAME, 'Query was last run '+Math.round(diff / 60000)+' minutes ago.');
        callback(err, diff > THRESHOLD);
    });
}

function tweetResponse(tweets, from_db) {
    LOG.log(LNAME, 'Sorting '+tweets.length+' tweets.');
    tweets.sort((a, b) => b.id - a.id);
    return {
        tweets: tweets,
        frequency: getFreq(tweets),
        from_db: from_db
    };
}

function updateTweets(query, sendBack) {
    TWIT_API.getTweets(query, (err, tweets) => {
        if(err === null) {
            DB.recordTweets(tweets);
            DB.recordQuery(query);
        }
        sendBack(err, tweetResponse(tweets, false));
    });
}

function retrieveTweets(query, sendBack) {
    DB.retrieveTweets(query, (err, tweets) => {
        sendBack(err, tweetResponse(tweets, true));
    });
}

search = function(data, sendBack) {
    let query = data.query;
    LOG.log(LNAME, 'Search query received: ' + query);

    if(data.db_only)
        retrieveTweets(query, sendBack);
    else
        needsUpdating(query, (err, needs) => {
            if (needs) updateTweets(query, sendBack);
            else retrieveTweets(query, sendBack);
        });
};

playerSearch = function(data, signalPlayerFound, sendPlayerData) {
    let query = data.query;
    DB.findPlayer(query, (err, playerName) => {
        if(err === null) {
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

openStream = function(query, streamBack) {
    let tokens = DB.tokenize(query);
    let users = '';
    let filter = '';

    for (let i = 0; i < tokens.keywords.length; i++) {
        let keyword = tokens.keywords[i];

        if (keyword.pre === 'AND') filter += ' ';
        else if (keyword.pre === 'OR') filter += ',';

        filter += keyword.word;
    }

    TWIT_API.findUserIds(0, users, tokens.users, (userStr) => {
        TWIT_API.openStream(userStr, filter, (err, tweet) => {
            if(err === null) DB.recordTweets([tweet]);
            streamBack(err, tweet);
        });
    });
};

closeStream = function() {
    TWIT_API.closeStream();
};

function getFreq(tweets) {
     let freq = {};

     for (let i in tweets) {
        let t = tweets[i];
        let y = t.date_time.year;
        let m = t.date_time.month;
        let d = t.date_time.date;

        let key = d + '/' + m + '/' + y;
        if (freq[key] === undefined) freq[key] = 0;
        freq[key]++;
     }

     return freq;
}

module.exports = {
    search,
    playerSearch,
    openStream,
    closeStream,
};