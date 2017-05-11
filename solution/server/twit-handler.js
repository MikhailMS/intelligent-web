/**
 * Created by blagoslav on 06.05.17.
 */
var Twitter = require('twitter');
var config = require('./config');

var twit = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});
var stream = null;

querySearch = function (msg, sendBack) {
    twit.get('search/tweets', { q: msg, lang: "en", count: 50 }, function (error, tweets, response) {
        sendBack(tweets);
    });
};

queryStream = function (msg, streamBack) {
    var filter = msg.replace(' AND ', ' ').replace(' OR ', ',');
    twit.stream('statuses/filter', { track: filter, language: 'en' }, function (stream) {
        stream.on('data', function (tweets) {
            const currentStream = stream;
            streamBack(tweets, currentStream);
        });
    });
};

module.exports = {
    querySearch: querySearch,
    queryStream: queryStream
};