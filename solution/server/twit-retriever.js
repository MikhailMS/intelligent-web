const Twitter = require('twitter'),
    config = require('./config'),
    LOG = require('./logger'),
    LNAME = 'TWITTER API',
    BATCHES = 6;

const twit_rest_err = {
    title: 'Twitter API Error',
    msg: 'There was an error retrieving the tweets using the Twitter REST API.'
};

const twit_stream_err = {
    title: 'Twitter API Error',
    msg: 'There was an error while streaming using the Twitter API.'

};

let currentStream;

const TWIT = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret,
});

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

function lowestID(arr, c, min) {
    if (arr.length === 0) return Infinity;
    if (c === undefined) return lowestID(arr, arr.length - 1, Infinity);
    const newMin = Math.min(arr[c].id, min);
    return c === 0 ? newMin : lowestID(arr, c - 1, newMin);
}

function getTweetBatch(c, procQuery, tweets, sendBack) {
    const lowestId = lowestID(tweets);
    const params = { q: procQuery, lang: 'en', count: 100, max_id: lowestId };
    TWIT.get('search/tweets', params, (err, data) => {
        LOG.log(LNAME, 'Received batch of '+data.statuses.length+' tweets.');
        const newTweets = data.statuses.map((el) => processTweet(el));
        tweets = tweets.concat(newTweets);
        if (c === 1 || newTweets.length < 100 || err !== null) {
            if(err === null)
                sendBack(null, tweets);
            else
                sendBack(twit_rest_err, tweets);
        } else {
            getTweetBatch(c - 1, procQuery, tweets, sendBack);
        }
    });
}

getTweets = function(query, sendBack) {
  const procQuery = query.split('BY ').join('from:');
  getTweetBatch(BATCHES, procQuery, [], (err, tweets) => {
     sendBack(err, tweets);
  });
};

findUserIds = function(c, userStr, users, carryOn) {
    if (c < users.length) {
        TWIT.get('users/show', { screen_name: users[c].word }, function (err, data) {
            var user = users[c];

            if (user.pre === 'AND') userStr += ' ';
            else if (user.pre === 'OR') userStr += ',';

            if (data !== undefined)
                userStr += data.id_str;
            findUserIds(c + 1, userStr, users, carryOn);
        });
    } else {
        carryOn(userStr);
    }
};

openStream = function (users, filter, streamBack) {
    LOG.log(LNAME, 'Opening stream with filter: ' + filter);
    if (users === '') users = null;
    if (filter === '') filter = null;
    TWIT.stream('statuses/filter', { follow: users, track: filter, language: 'en' }, function (stream) {

        currentStream = stream;

        stream.on('data', (data) => {
            streamBack(null, processTweet(data));
        });

        stream.on('error', (error) => {
            streamBack(twit_stream_err, null);
        });
    });
};

closeStream = function() {
    LOG.log(LNAME, 'Closing stream.');
    if (currentStream !== undefined)
        currentStream.destroy(); // close stream
};


module.exports = {
    getTweets,
    openStream,
    closeStream,
    findUserIds
};
