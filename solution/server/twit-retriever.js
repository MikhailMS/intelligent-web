/**
 * twit-retriever.js
 *
 * This file provides an abstraction
 * layer over the Twitter API and is
 * used by twit-manager.js to retrieve
 * tweets from Twitter and also to
 * start and stop streaming.
 *
 * Written by:  Blagoslav Mihaylov, Petar Barzev
 * Last updated: 21/05/2017
 */

//load dependencies
const Twitter = require('twitter'),
    config = require('./config'),
    LOG = require('./logger'),
    ERR = require('./errors'),
    LNAME = 'TWITTER API', //name used in logging
    BATCHES = 6,
    STREAM_INTERVAL = 1000;

//declare stream vars
let currentStream;
let tweetPool = [];
let lastStreamed = 0;

//load keys
const TWIT = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret,
});

/**
 * Receives a raw tweet from the Twitter API
 * and converts it to an object usable by
 * the client.
 *
 * @param tweet - raw tweet
 * @returns processed tweet
 */
function processTweet(tweet) {
    const timeDateList = tweet.created_at.split(' ');
    return {
        id: tweet.id_str,
        text: tweet.text,
        author_name: tweet.user.name,
        user_name: tweet.user.screen_name,
        profile_url: `http://twitter.com/${tweet.user.screen_name}`,
        avatar_url: tweet.user.profile_image_url,
        tweet_url: `http://twitter.com/anyuser/status/${tweet.id_str}`,
        date_time: {
            week_day: timeDateList[0],
            month: timeDateList[1],
            date: timeDateList[2],
            time: timeDateList[3],
            year: timeDateList[5]
        },
    };
}

/**
 * Recursive function used to find the
 * lowest id in a list of tweets.
 *
 * @param arr - array of tweets
 * @param c - current index (goes down to 0)
 * @param min - current lowest ID
 * @returns lowest ID
 */
function lowestID(arr, c, min) {
    //if empty array was supplied, return infinity
    if (arr.length === 0)
        return Infinity;

    //if not a recursive call, initiate a recursive call
    if (c === undefined)
        return lowestID(arr, arr.length - 1, Infinity);

    //decide if current value is lower
    const newMin = Math.min(arr[c].id, min);

    //recurse or return based on current index
    return c === 0 ? newMin : lowestID(arr, c - 1, newMin);
}

/**
 * Recursive function used to populate
 * a list of tweets in batches, using the
 * Twitter REST API. Necessary because of
 * 100 tweet limit for every API call.
 *
 * @param c - current batch
 * @param procQuery - processed query
 * @param tweets - list of tweets (starts empty)
 * @param sendBack - callback (send tweets to caller)
 */
function getTweetBatch(c, procQuery, tweets, sendBack) {
    //get the lowest ID in the last batch
    const lowestId = lowestID(tweets); //Infinity if empty
    //generate search parameters
    const params = { q: procQuery, lang: 'en', count: 100, max_id: lowestId };

    //ask the Twitter API for a list of tweets
    TWIT.get('search/tweets', params, (err, data) => {
        LOG.log(LNAME, 'Received batch of ' + data.statuses.length + ' tweets.');

        //add new tweets to the list
        const newTweets = data.statuses.map((el) => processTweet(el));
        tweets = tweets.concat(newTweets);

        //stop recursion if reached number of batches,
        //or if batch returned an incomplete batch (means no more are left)
        //or if there was an error
        if (c === 1 || newTweets.length < 1 || err !== null) {
            if (err === null)
                sendBack(null, tweets); //return tweets
            else
                sendBack(ERR.TWIT_REST, null); //return error
        } else { //continue recursion
            getTweetBatch(c - 1, procQuery, tweets, sendBack);
        }
    });
}

/**
 * Exported function which returns a list
 * of tweets from the Twitter API.
 *
 * @param query - raw query supplied by client
 * @param sendBack - callback (takes tweet list)
 */
const getTweets = function (query, sendBack) {
    //process query
    const procQuery = query.split('BY ').join('from:');
    //call recursive function
    getTweetBatch(BATCHES, procQuery, [], (err, tweets) => {
        if (tweets.length === 0)
            err = ERR.TWIT_EMPTY;
        sendBack(err, tweets);
    });
};

/**
 * Recursive function used to convert a
 * list of Twitter user names to a list
 * of user IDs.
 *
 * @param c - current index (starts from 0)
 * @param userStr - string of user IDs separated by commas
 * @param users - list of user names
 * @param carryOn - callback
 */
const findUserIds = function (c, userStr, users, carryOn) {
    //if not reached the end of the array
    if (c < users.length) {
        //ask the Twitter API for the user id
        TWIT.get('users/show', { screen_name: users[c].word }, function (err, data) {
            let user = users[c];

            if (user.pre === 'AND') userStr += ' ';
            else if (user.pre === 'OR') userStr += ',';

            if (data !== undefined)
                userStr += data.id_str;
            //recurse
            findUserIds(c + 1, userStr, users, carryOn);
        });
    } else {
        //when done, send user string back
        carryOn(userStr);
    }
};

/**
 * Used to open a stream with the
 * specified user IDs and word filter.
 *
 * @param users - string of comma-separated user IDs
 * @param filter - string of comma-separated words
 * @param streamBack - callback (returns single tweet)
 */
const openStream = function (users, filter, streamBack) {
    LOG.log(LNAME, 'Opening stream with filter: ' + filter);

    //initialize parameters
    if (users === '') users = null;
    if (filter === '') filter = null;
    let params = { follow: users, track: filter, language: 'en' };

    //start stream
    TWIT.stream('statuses/filter', params, (stream) => {

        //reset tweet pool
        tweetPool = [];
        //remember current stream
        currentStream = stream;

        //stream back data
        stream.on('data', (data) => {
            if (data.created_at !== undefined) {
                tweetPool.push(processTweet(data));
                let now = Date.now();
                if (now - lastStreamed > STREAM_INTERVAL) {
                    //stream back random tweet
                    let tid = Math.floor(Math.random() * tweetPool.length);
                    streamBack(null, tweetPool[tid]);

                    //log stream frequency
                    let lmsg = 'Stream received ' + tweetPool.length +
                        ' in the last ' + STREAM_INTERVAL / 1000 + ' secs.';
                    LOG.log(LNAME, lmsg);

                    //reset vars
                    tweetPool = [];
                    lastStreamed = now;
                }
            }
        });
        //send back error
        stream.on('error', (error) => {
            if (error.message.includes('420'))
                streamBack(ERR.TWIT_RATE_LIM, {});
            else
                streamBack(ERR.TWIT_STREAM, {});
            closeStream();
        });
    });
};

/**
 * Used to close the current stream.
 */
const closeStream = function () {
    if (currentStream !== undefined) {
        LOG.log(LNAME, 'Closing stream.');
        currentStream.destroy(); // close stream
        currentStream = undefined;
    }
};

//export functions
module.exports = {
    getTweets,
    openStream,
    closeStream,
    findUserIds
};
