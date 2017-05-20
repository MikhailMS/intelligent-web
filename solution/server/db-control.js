const   SQLITE3 = require('sqlite3'),
        DB = new SQLITE3.Database('db.sqlite3'),
        LOG = require('./logger'),
        LNAME = 'DATABASE';

const db_error = {
    title: 'Database error',
    msg: 'There was an error reaching the database.'
};

const createTableTweets = ""+
    "CREATE TABLE `tweets` (" +
        "`id`	INTEGER NOT NULL UNIQUE," +
        "`text`	TEXT," +
        "`author_name`	TEXT," +
        "`user_name`	TEXT," +
        "`profile_url`	TEXT," +
        "`avatar_url`	TEXT," +
        "`tweet_url`	TEXT," +
        "`week_day`	TEXT," +
        "`month`	TEXT," +
        "`date`	TEXT," +
        "`time`	TEXT," +
        "`year`	TEXT," +
        "PRIMARY KEY(id)" +
    ");";

const createTableQueries = ""+
    "CREATE TABLE `queries` ("+
        "`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,"+
        "`text`	TEXT NOT NULL UNIQUE,"+
        "`time`	TIMESTAMP NOT NULL"+
    ");";

const createTableDBPediaNames = "" +
    "CREATE TABLE `dbpedia_names` ("+
        "`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,"+
        "`key`	TEXT NOT NULL UNIQUE,"+
        "`name`	TEXT NOT NULL"+
    ");";

const dropTableTweets = "DROP TABLE 'tweets';";
const dropTableQueries = "DROP TABLE 'queries';";
const dropTableDBPediaNames = "DROP TABLE 'dbpedia_names';";

const insertTweet = "INSERT INTO tweets VALUES(?,?,?,?,?,?,?,?,?,?,?,?);";
const tweetCount = "SELECT COUNT(1) AS count FROM tweets WHERE id=?;";

const getLastUpdated = "SELECT time FROM queries WHERE text=?;";

const queryCount = "SELECT COUNT(1) AS count FROM queries WHERE text=?;";
const insertQuery = "INSERT INTO queries (text, time) VALUES (?, ?);";
const updateQuery = "UPDATE queries SET time=? WHERE text=?;";

createDatabase = function () {
    DB.run(createTableTweets);
    DB.run(createTableQueries);
    DB.run(createTableDBPediaNames);
};

dropDatabase = function() {
    DB.run(dropTableTweets);
    DB.run(dropTableQueries);
    DB.run(dropTableDBPediaNames);
};

resetDatabase = function () {
    dropDatabase();
    createDatabase();
};

function tweetToSql(tweet) {
    return [
        tweet.id,
        tweet.text,
        tweet.author_name,
        tweet.user_name,
        tweet.profile_url,
        tweet.avatar_url,
        tweet.tweet_url,
        tweet.date_time.week_day,
        tweet.date_time.month,
        tweet.date_time.date,
        tweet.date_time.time,
        tweet.date_time.year
    ];
}

function sqlToTweet(sqlResult) {
    return {
        id: sqlResult.id,
        text: sqlResult.text,
        author_name: sqlResult.author_name,
        user_name: sqlResult.user_name,
        profile_url: sqlResult.profile_url,
        avatar_url: sqlResult.avatar_url,
        tweet_url: sqlResult.tweet_url,
        date_time: {
            week_day: sqlResult.week_day,
            month: sqlResult.month,
            date: sqlResult.date,
            time: sqlResult.time,
            year: sqlResult.year
        }
    };
}

function recordTweet(c, tweets) {
    let t = tweets[c];
    DB.prepare(tweetCount).get(t.id, (err, res) => {
        if (res.count < 0)
            DB.prepare(insertTweet).run(tweetToSql(t));
        if(c > 0) recordTweet(c-1, tweets);
    });
}

recordTweets = function (tweets) {
    if(tweets.length > 0) {
        LOG.log(LNAME, 'Recording ' + tweets.length + ' tweets in the Database.');
        recordTweet(tweets.length - 1, tweets);
    }
};

tokenize = function(msg) {
    let query = msg.split(',').join('').split(' ');
    let keywords = [];
    let users = [];

    for(let c = 0; c < query.length; c++) {
        let token = query[c];
        if (['AND', 'OR', 'BY'].indexOf(token) < 0) {
            if(c === 0) {
                keywords.push({pre: '', word: token});
            } else {
                if(query[c-1] === 'OR') {
                    keywords.push({pre: 'OR', word: token});
                } else if(query[c-1] === 'BY') {
                    if(users.length === 0) {
                        users.push({pre: '', word: token});
                    } else {
                        if (c > 1 && query[c - 2] === 'OR')
                            users.push({pre: 'OR', word: token});
                        else
                            users.push({pre: 'AND', word: token});
                    }
                } else {
                    keywords.push({pre: 'AND', word: token});
                }
            }
        }
    }

    return {keywords: keywords, users: users};
};

function queryToSql(msg) {
    let sql = "SELECT * FROM tweets WHERE ";
    let args = [];

    let tokens = tokenize(msg);

    let keywords = tokens.keywords;
    let users = tokens.users;

    for(let c = 0; c < keywords.length; c++) {
        if(c > 0) sql += ' ' + keywords[c].pre;
        sql += ' (text LIKE ? OR user_name LIKE ?) ';
        args.push('%' + keywords[c].word + '%');
        args.push('%' + keywords[c].word + '%');
    }

    if(users.length > 0) {
        if(keywords.length !== 0) sql += ' AND ';
        sql += '(';
        for (c = 0; c < users.length; c++) {
            sql += ' ' + users[c].pre + ' user_name=?';
            args.push(users[c].word);
        }
        sql += ')';
    }

    return { sql: sql, args: args };
}

retrieveTweets = function (msg, sendBack) {
    LOG.log(LNAME, 'Retrieving tweets from the Database.');

    let processedQuery = queryToSql(msg);
    let sql = processedQuery.sql;
    let args = processedQuery.args;

    let results = [];
    DB.each(sql, args, (err, t) => {
        if (t !== undefined)
            results.push(sqlToTweet(t));
    }, (err) => {
        if(err !== null) sendBack(db_error, null);
        else sendBack(null, results);
    });
};

lastUpdated = function(query, callback) {
    DB.prepare(getLastUpdated).get(query, (err, res) => {
        if(err === null) {
            let time = res === undefined ? (-Infinity) : res.time;
            callback(null, time);
        } else {
            callback(db_error, null);
        }
    });
};

recordQuery = function(query) {
    let timeStamp = Math.floor(Date.now());

    DB.prepare(queryCount).get(query, (err, res) => {
        if (res.count === 0)
            DB.prepare(insertQuery).run([query, timeStamp]);
        else
            DB.prepare(updateQuery).run([timeStamp, query]);
    });
};

findPlayer = function(query, callback) {
    let sql = "SELECT name FROM 'dbpedia_names' WHERE ";
    let queryArr = query.split(" ");
    let args = [];

    for(let i = 0; i < queryArr.length; i++) {
        if(['AND', 'OR', 'BY'].indexOf(queryArr[i] < 0)) {
            if(i > 0) sql += " OR ";
            sql += "key LIKE ?";
            let word = queryArr[i].split('#').join('').split('@').join('');
            args.push('%'+word+'%');
        }
    }
    sql += " LIMIT 1;";

    DB.prepare(sql).get(args, (err, res) => {
        if(err === null) {
            if(res !== undefined) {
                LOG.log(LNAME, 'Found '+res.name+' in database.');
                callback(null, res.name);
            } else {
                LOG.log(LNAME, 'No footballer found in database.');
            }
        } else {
            callback(db_error, null);
        }
    });
};

module.exports = {
    createDatabase,
    dropDatabase,
    resetDatabase,

    recordTweets,
    retrieveTweets,

    lastUpdated,
    recordQuery,

    tokenize,
    findPlayer
};