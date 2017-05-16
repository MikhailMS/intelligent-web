/**
 * Created by blagoslav on 06.05.17.
 */
var Twitter = require('twitter');
var config = require('./config');
var db = require('./dbcontrol');

//creates the tables anew
//db.initDatabase();

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

querySearch = function (msg, sendBack) {
    if (msg.db_only) {
        db.queryDatabase(msg.query, sendBack);
    } else {
        var dbOnly = false;
        twit.get('search/tweets', { q: msg.query, lang: "en", count: 50 }, function (error, data, response) {
            var tweets = processTweets(data);
            db.saveTweets(tweets);
            sendBack(tweets, dbOnly);
        });
    }
};

queryStream = function (msg, streamBack) {
    var filter = msg.replace(' AND ', ' ').replace(' OR ', ',');
    twit.stream('statuses/filter', { track: filter, language: 'en' }, function (stream) {
        stream.on('data', function (data) {
            const currentStream = stream;
            var tweet = processTweet(data);
            db.saveTweets([tweet]);
            streamBack(tweet, currentStream);
        });
    });
};

module.exports = {
    querySearch: querySearch,
    queryStream: queryStream
};