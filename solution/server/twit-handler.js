/**
 * Created by blagoslav on 06.05.17.
 */
var Twitter = require('twitter');
var config = require('./config');
var db = require('./dbcontrol');

//creates the tables anew
//db.resetDatabase();

var twit = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});

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
    for (var t in rawTweets.statuses)
        tweets.push(processTweet(rawTweets.statuses[t]));
    return tweets;
};

getTweets = function(query, sendBack) {
    console.log('Retreiving tweets using Twitter REST API.');
    var q = query.split('BY ').join('from:');
    twit.get('search/tweets', { q: q, lang: "en", count: 50 }, function (error, data, response) {
        var tweets = processTweets(data);
        db.saveTweets(tweets);
        sendBack(tweets);
    });
};

querySearch = function (msg, sendBack) {

    var threshold = 5 * 60 * 1000; //5 minutes

    var dbOnly = msg.db_only;
    var query = msg.query;

    if (dbOnly) {
        db.queryDatabase(query, sendBack);
    } else {
        db.lastUpdated(query, function(lastUpdated) {
            var diff = Math.floor(Date.now()) - lastUpdated;
            console.log('Time since last update: '+Math.round(diff/60000)+' mins.');
            if(diff > threshold) {
                db.saveQuery(query);
                getTweets(query, sendBack);
            } else {
                db.queryDatabase(query, sendBack);
            }
        });
    }
};

startStream = function(users, filter, streamBack) {
    if(users === '') users = null;
    if(filter === '') filter = null;
    twit.stream('statuses/filter', { follow: users, track: filter, language: 'en' }, function (stream) {
        stream.on('data', function (data) {
            const currentStream = stream;
            var tweet = processTweet(data);
            db.saveTweets([tweet]);
            streamBack(tweet, currentStream);
        });
    });
};

processUsers = function(c, userStr, users, carryOn) {
    if(c < users.length) {
        twit.get('users/show', {screen_name: users[c].word}, function(err, data) {
           var user = users[c];

            if(user.pre === 'AND') userStr += ' ';
            else if(user.pre === 'OR') userStr += ',';

            if(data !== undefined)
                userStr += data.id_str;
            processUsers(c+1, userStr, users, carryOn);
        });
    } else {
        carryOn(userStr);
    }
};

queryStream = function (msg, streamBack) {
    var tokens = db.tokenize(msg);

    var users = '';
    var filter = '';

    for(var i = 0; i < tokens.keywords.length; i++) {
        var keyword = tokens.keywords[i];

        if(keyword.pre === 'AND') filter += ' ';
        else if(keyword.pre === 'OR') filter += ',';

        filter += keyword.word;
    }

    processUsers(0, users, tokens.users, function(userStr) {
        startStream(userStr, filter, streamBack);
    });
};

module.exports = {
    querySearch: querySearch,
    queryStream: queryStream
};