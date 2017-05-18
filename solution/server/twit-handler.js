const Twitter = require('twitter'),
    config = require('./config'),
    DATABASE = require('./dbcontrol');

const TWITTER = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret,
});

const APP_STATE = {
    tweets: [],
    lowestId: null,
};

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

function processTweets(rawTweets) {
    let lowestId = APP_STATE.lowestId;
    console.log('lowestId', lowestId);
    const tweets = rawTweets.statuses.map(status => {
        let { id } = status;
        id = parseInt(id, 10);
        console.log('tweetId', id);
        console.log('typeofid after parse', typeof id);
        const processedTweet = processTweet(status);
        if (id < lowestId || lowestId === null) lowestId = id;
        return processedTweet;
    });
    return { tweets, lowestId };
}

function searchTwitter(query) {
    return new Promise((resolve, reject) => {
        const searchParams = APP_STATE.lowestId
            ? { q: query, lang: 'en', count: 100, max_id: APP_STATE.lowestId }
            : { q: query, lang: 'en', count: 100 };
        TWITTER.get('search/tweets', searchParams, (err, data, response) => {
            if (err) reject(err);
            try {
                const { tweets: resTweets, lowestId: lowestIdNew } = processTweets(data);
                DATABASE.saveTweets(resTweets);
                APP_STATE.tweets = APP_STATE.tweets.concat(resTweets);
                APP_STATE.lowestId = lowestIdNew;
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    });
}

function getTweets(query, sendBack) {
    const procQuery = query.split('BY ').join('from:');
    const TIMES = 6, // generate 600 tweets - 6 x 100 (max)
        promises = [];

    for (let i = 0; i < TIMES; i++) { promises.push(searchTwitter(procQuery)); }
    return Promise
        .all(promises)
        .then(() => sendBack(APP_STATE.tweets))
        .catch(err => console.error(err));
}

querySearch = function (msg, sendBack) {
    var threshold = 5 * 60 * 1000; //5 minutes

    var dbOnly = msg.db_only;
    var query = msg.query;

    if (dbOnly) {
        DATABASE.queryDatabase(query, sendBack);
    } else {
        DATABASE.lastUpdated(query, function (lastUpdated) {
            var diff = Math.floor(Date.now()) - lastUpdated;
            console.log('Time since last update: ' + Math.round(diff / 60000) + ' mins.');
            if (diff > threshold) {
                DATABASE.saveQuery(query);
                getTweets(query, sendBack);
            } else {
                DATABASE.queryDatabase(query, sendBack);
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
            DATABASE.saveTweets([tweet]);
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
    var tokens = DATABASE.tokenize(msg);

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
