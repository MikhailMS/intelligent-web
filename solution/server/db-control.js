/**
 * db-control.js
 *
 * Controls the database functionality.
 * The functions are used to store and
 * retrieve data from the database about
 * tweets, players and past queries.
 *
 * Written by:  Blagoslav Mihaylov
 * Last updated: 20/05/2017
 */

//load dependencies
const SQLITE3 = require('sqlite3'),
    DB = new SQLITE3.Database('db.sqlite3'),
    LOG = require('./logger'),
    LNAME = 'DATABASE'; //name used in logging

//init errors
const db_error = {
    title: 'Database error',
    msg: 'There was an error reaching the database.'
};

//SQL query for creating tweets table
const createTableTweets = "" +
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

//SQL for creating queries table
const createTableQueries = "" +
    "CREATE TABLE `queries` (" +
    "`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE," +
    "`text`	TEXT NOT NULL UNIQUE," +
    "`time`	TIMESTAMP NOT NULL" +
    ");";

//SQl for creating dbpedia_names table
const createTableDBPediaNames = "" +
    "CREATE TABLE `dbpedia_names` (" +
    "`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE," +
    "`key`	TEXT NOT NULL UNIQUE," +
    "`name`	TEXT NOT NULL" +
    ");";

//SQL for destroying the tables
const dropTableTweets = "DROP TABLE 'tweets';";
const dropTableQueries = "DROP TABLE 'queries';";
const dropTableDBPediaNames = "DROP TABLE 'dbpedia_names';";

//various SQL queries
const insertTweet = "INSERT INTO tweets VALUES(?,?,?,?,?,?,?,?,?,?,?,?);";
const tweetCount = "SELECT COUNT(1) AS count FROM tweets WHERE id=?;";

const getLastUpdated = "SELECT time FROM queries WHERE text=?;";

const queryCount = "SELECT COUNT(1) AS count FROM queries WHERE text=?;";
const insertQuery = "INSERT INTO queries (text, time) VALUES (?, ?);";
const updateQuery = "UPDATE queries SET time=? WHERE text=?;";

/**
 * Used to initialize the database
 * by creating three tables.
 */
createDatabase = function () {
    DB.run(createTableTweets);
    DB.run(createTableQueries);
    DB.run(createTableDBPediaNames);
};

/**
 * Used to delete the database
 * by destroying three tables.
 */
dropDatabase = function () {
    DB.run(dropTableTweets);
    DB.run(dropTableQueries);
    DB.run(dropTableDBPediaNames);
};

/**
 * Used to reset the database
 * by destroying and then
 * creating it again.
 */
resetDatabase = function () {
    dropDatabase();
    createDatabase();
};

/**
 * Converts a tweet object to a list
 * of arguments to be used when executing
 * an SQL INSERT query.
 *
 * @param tweet - tweet object
 * @returns list of arguments
 */
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

/**
 * Converts the result of an SQL
 * SELECT query to a tweet object.
 *
 * @param sqlResult - result of SELECT query
 * @returns tweet object
 */
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

/**
 * Recursive function used to
 * record a list of queries in
 * the database.
 *
 * @param c - current index (goes to 0)
 * @param tweets - list of tweets
 */
function recordTweet(c, tweets) {
    let t = tweets[c];
    //see if tweet is already in database
    DB.prepare(tweetCount).get(t.id, (err, res) => {
        //if not present, insert it
        if (res.count < 0)
            DB.prepare(insertTweet).run(tweetToSql(t));
        //continue recursion
        if (c > 0) recordTweet(c - 1, tweets);
    });
}

/**
 * Exported function used to record
 * a list of tweets.
 *
 * @param tweets - list of tweets
 */
recordTweets = function (tweets) {
    //if not empty
    if (tweets.length > 0) {
        LOG.log(LNAME, 'Recording ' + tweets.length + ' tweets in the Database.');
        recordTweet(tweets.length - 1, tweets); //initiate recursion
    }
};

/**
 * Converts a query to a list of tokens.
 * Every token has a prefix and a word.
 * The prefix can be AND/OR/BY.
 *
 * @param msg - query
 * @returns {{keywords: Array, users: Array}}
 */
tokenize = function (msg) {
    //filter out commas
    let query = msg.split(',').join('').split(' ');

    //initialize arrays
    let keywords = [];
    let users = [];

    //for every word in the query
    for (let c = 0; c < query.length; c++) {
        let token = query[c];
        //if word is AND/OR/BY, then skip it
        if (['AND', 'OR', 'BY'].indexOf(token) < 0) {
            //first token does not have a prefix
            if (c === 0) {
                keywords.push({ pre: '', word: token });
            } else { //for every other token
                //if previous word was OR, add OR prefix
                if (query[c - 1] === 'OR') {
                    keywords.push({ pre: 'OR', word: token });
                } else if (query[c - 1] === 'BY') {
                    //if previous word was BY, then add
                    //to users array
                    if (users.length === 0) {
                        users.push({ pre: '', word: token });
                    } else {
                        //check the word before the previous one
                        if (c > 1 && query[c - 2] === 'OR')
                            users.push({ pre: 'OR', word: token });
                        else
                            users.push({ pre: 'AND', word: token });
                    }
                } else { //otherwise prefix is AND
                    keywords.push({ pre: 'AND', word: token });
                }
            }
        }
    }

    return { keywords: keywords, users: users };
};

/**
 * Converts a client query to an SQL
 * query which can be used to retrieve
 * tweets from database based on that query.
 *
 * @param msg - query
 * @returns {{sql: string, args: Array}} - query and arguments
 */
function queryToSql(msg) {
    let sql = "SELECT * FROM tweets WHERE ";
    let args = [];

    let tokens = tokenize(msg);

    let keywords = tokens.keywords;
    let users = tokens.users;

    //convert keywords
    for (let c = 0; c < keywords.length; c++) {
        if (c > 0) sql += ' ' + keywords[c].pre;
        sql += ' (text LIKE ? OR user_name LIKE ?) ';
        args.push('%' + keywords[c].word + '%');
        args.push('%' + keywords[c].word + '%');
    }

    //users are added separately to the query
    if (users.length > 0) {
        if (keywords.length !== 0) sql += ' AND ';
        sql += '(';
        for (c = 0; c < users.length; c++) {
            sql += ' ' + users[c].pre + ' user_name=?';
            args.push(users[c].word);
        }
        sql += ')';
    }

    return { sql: sql, args: args };
}

/**
 * Used to retrieve tweets from the
 * database using a raw query from the
 * client.
 *
 * @param msg - query
 * @param sendBack - callback (takes tweet list)
 */
retrieveTweets = function (msg, sendBack) {
    LOG.log(LNAME, 'Retrieving tweets from the Database.');

    //generate SQL query
    let processedQuery = queryToSql(msg);
    let sql = processedQuery.sql;
    let args = processedQuery.args;

    //execute query
    let results = [];
    DB.each(sql, args, (err, t) => {
        //add tweet to array
        if (t !== undefined)
            results.push(sqlToTweet(t));
    }, (err) => {
        //handle error and send back results
        if (err !== null) sendBack(db_error, null);
        else sendBack(null, results);
    });
};

/**
 * Find when a query was executed
 * for the last time.
 *
 * @param query - the query
 * @param callback - receives the UTC timestamp
 */
lastUpdated = function (query, callback) {
    //execute query
    DB.prepare(getLastUpdated).get(query, (err, res) => {
        if (err === null) {
            //if never executed, return infinity
            let time = res === undefined ? (-Infinity) : res.time;
            callback(null, time);
        } else {
            callback(db_error, null);
        }
    });
};

/**
 * Records a query in the database.
 *
 * @param query - the query
 */
recordQuery = function (query) {
    //get timestamp
    let timeStamp = Math.floor(Date.now());

    //execute query
    DB.prepare(queryCount).get(query, (err, res) => {
        //insert or update based on whether the query
        //already exists in the database
        if (res.count === 0)
            DB.prepare(insertQuery).run([query, timeStamp]);
        else
            DB.prepare(updateQuery).run([timeStamp, query]);
    });
};

/**
 * Looks in the database for a player,
 * which can be used to query DBPedia
 * for football player details.
 *
 * @param query - the raw query from the client
 * @param callback - gets back the name of the DBPedia page
 */
findPlayer = function (query, callback) {
    let sql = "SELECT name FROM 'dbpedia_names' WHERE ";
    let queryArr = query.split(" ");
    let args = [];

    //generate the SQL query
    for (let i = 0; i < queryArr.length; i++) {
        if (['AND', 'OR', 'BY'].indexOf(queryArr[i]) < 0) {
            if (i > 0) sql += " OR ";
            sql += "key LIKE ?";
            let word = queryArr[i].split('#').join('').split('@').join('');
            args.push('% ' + word + ' %');
        }
    }
    sql += " LIMIT 1;";

    //execute query
    DB.prepare(sql).get(args, (err, res) => {
        if (err === null) {
            if (res !== undefined) {
                //return DBPedia name for player if found
                LOG.log(LNAME, 'Found ' + res.name + ' in database.');
                callback(null, res.name);
            } else {
                LOG.log(LNAME, 'No footballer found in database.');
            }
        } else {
            callback(db_error, null);
        }
    });
};

//export functions
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
