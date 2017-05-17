/**
 * Created by blagoslav on 06.05.17.
 */
var Twitter = require('twitter');
var config = require('./config');
var db = require('./dbcontrol');
var Promise = require('bluebird');

//creates the tables anew
//db.resetDatabase();

var twit = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});

// global array that will contain the tweets sent to client
var tweets = [];

processTweet = function (tweet) {
    var timeDateList = tweet.created_at.split(' ');
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
        }
    };
};

processTweets = function (rawTweets) {
    var tweets = [];
    var lowest_id = null;
    for (var t in rawTweets.statuses) {
        tweets.push(processTweet(rawTweets.statuses[t]));
        var tweetId = rawTweets.statuses[t].id; // get tweet id
        if (tweetId < lowest_id || lowest_id === null) // get lowest id from that batch
            lowest_id = tweetId;
    }
    var result = [tweets, lowest_id];
    return result;
};

/**
 * Gets 100 tweets and adds them to the supplied tweets array.
 * Returns a Promise, used to make sure the information has been gathered
 */
searchTwitter = function (q) {
    return new Promise(function (resolve, reject) {
        var lowest_id = null;
        console.log('tweets length', tweets.length);
        // if a lowest_id has been found, use it to find tweets older than it
        if (lowest_id === null)
            searchParam = { q, lang: "en", count: 100 };
        else searchParam = { q, lang: "en", count: 100, max_id: lowest_id };
        twit.get('search/tweets', searchParam, function (error, data, response) {
            var result = processTweets(data);
            db.saveTweets(result[0]); // save tweets
            tweets.concat(result[0]); // add them to client info array
            lowest_id = result[1]; // get the lowest_id from that batch
        });
        resolve('resolved');
    });
}

getTweets = function (query, sendBack) {
    console.log('Retreiving tweets using Twitter REST API.');
    var q = query.split('BY ').join('from:');

    // generate 600 results and send to client
    searchTwitter(q).then(searchTwitter(q)).then(
        searchTwitter(q)).then(searchTwitter(q)).then(
        searchTwitter(q)).then(searchTwitter(q)).then(sendBack(tweets)).then(console.log('tweets length', tweets.length));
};

querySearch = function (msg, sendBack) {

    var threshold = 5 * 60 * 1000; //5 minutes

    var dbOnly = msg.db_only;
    var query = msg.query;

    if (dbOnly) {
        db.queryDatabase(query, sendBack);
    } else {
        db.lastUpdated(query, function (lastUpdated) {
            var diff = Math.floor(Date.now()) - lastUpdated;
            console.log('Time since last update: ' + Math.round(diff / 60000) + ' mins.');
            if (diff > threshold) {
                db.saveQuery(query);
                getTweets(query, sendBack);
            } else {
                db.queryDatabase(query, sendBack);
            }
        });
    }
};

startStream = function (users, filter, streamBack) {
    if (users === '') users = null;
    if (filter === '') filter = null;
    twit.stream('statuses/filter', { follow: users, track: filter, language: 'en' }, function (stream) {
        stream.on('data', function (data) {
            const currentStream = stream;
            var tweet = processTweet(data);
            db.saveTweets([tweet]);
            streamBack(tweet, currentStream);
        });
    });
};

processUsers = function (c, userStr, users, carryOn) {
    if (c < users.length) {
        twit.get('users/show', { screen_name: users[c].word }, function (err, data) {
            var user = users[c];

            if (user.pre === 'AND') userStr += ' ';
            else if (user.pre === 'OR') userStr += ',';

            if (data !== undefined)
                userStr += data.id_str;
            processUsers(c + 1, userStr, users, carryOn);
        });
    } else {
        carryOn(userStr);
    }
};

queryStream = function (msg, streamBack) {
    var tokens = db.tokenize(msg);

    var users = '';
    var filter = '';

    for (var i = 0; i < tokens.keywords.length; i++) {
        var keyword = tokens.keywords[i];

        if (keyword.pre === 'AND') filter += ' ';
        else if (keyword.pre === 'OR') filter += ',';

        filter += keyword.word;
    }

    processUsers(0, users, tokens.users, function (userStr) {
        startStream(userStr, filter, streamBack);
    });
};

module.exports = { querySearch, queryStream };