const Twitter = require('twitter'),
    config = require('./config'),
    DB = require('./dbcontrol');

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
    if(arr.length === 0) return Infinity;
    if(c === undefined) return lowestID(arr, arr.length-1, Infinity);
    let newMin = Math.min(arr[c].id, min);
    return c === 0? newMin : lowestID(arr, c-1, newMin);
}

function getTweetBatch(c, procQuery, tweets, sendBack) {
    let lowestId = lowestID(tweets);
    console.log(lowestId);
    const params = {q: procQuery, lang: 'en', count: 100, max_id: lowestId};
    TWIT.get('search/tweets', params, (err, data) => {
        var newTweets = data.statuses.map((el) => processTweet(el));
        tweets = tweets.concat(newTweets);
        if(c === 1 || newTweets.length < 100) sendBack(tweets);
        else getTweetBatch(c-1, procQuery, tweets, sendBack);
    });
}

function getTweets(query, sendBack) {
    const procQuery = query.split('BY ').join('from:');
    const TIMES = 6;

    getTweetBatch(TIMES, procQuery, [], function(tweets) {
        sendBack(tweets);
        DB.saveTweets(tweets);
    });
}

querySearch = function (msg, sendBack) {
    var threshold = 5 * 60 * 1000; //5 minutes

    var dbOnly = msg.db_only;
    var query = msg.query;

    if (dbOnly) {
        DB.queryDatabase(query, sendBack);
    } else {
        DB.lastUpdated(query, function (lastUpdated) {
            var diff = Math.floor(Date.now()) - lastUpdated;
            console.log('Time since last update: ' + Math.round(diff / 60000) + ' mins.');
            if (diff > threshold) {
                getTweets(query, sendBack);
                DB.saveQuery(query);
            } else {
                DB.queryDatabase(query, sendBack);
            }
        });
    }
};

startStream = function (users, filter, streamBack) {
    if (users === '') users = null;
    if (filter === '') filter = null;
    TWIT.stream('statuses/filter', { follow: users, track: filter, language: 'en' }, function (stream) {
        stream.on('data', function (data) {
            const currentStream = stream;
            var tweet = processTweet(data);
            DB.saveTweets([tweet]);
            streamBack(tweet, currentStream);
        });
    });
};

processUsers = function (c, userStr, users, carryOn) {
    if (c < users.length) {
        TWIT.get('users/show', { screen_name: users[c].word }, function (err, data) {
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
    var tokens = DB.tokenize(msg);

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

getFreqMap = function(tweets) {
    var freq = {};
    for(let i in tweets) {
        let t = tweets[i];
        let y = t.date_time.year;
        let m = t.date_time.month;
        let d = t.date_time.date;

        let key = d + '/' + m + '/' + y;
        if(freq[key] === undefined) freq[key] = 0;
        freq[key] ++;
    }

    return freq;
};


module.exports = { querySearch, queryStream, getFreqMap, getPlayerName: DB.getPlayerName };
