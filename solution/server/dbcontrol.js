var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('db.sqlite3');

initDatabase = function () {
    db.run("CREATE TABLE `tweets` (" +
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
        ");");

    db.run("CREATE TABLE `queries` ("+
        "`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,"+
        "`text`	TEXT NOT NULL UNIQUE,"+
        "`time`	TIMESTAMP NOT NULL"+
        ");");

    db.run("CREATE TABLE `dbpedia_names` ("+
        "`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,"+
        "`key`	TEXT NOT NULL UNIQUE,"+
        "`name`	TEXT NOT NULL"+
    ");");
};

deleteDatabase = function () {
    db.run("DROP TABLE 'tweets';");
    db.run("DROP TABLE 'queries';");
    db.run("DROP TABLE 'dbpedia_names';");
};

resetDatabase = function () {
    deleteDatabase();
    initDatabase();
};

saveTweet = function(c, tweets) {
    if(c < tweets.length) {
        var t = tweets[c];
        var insert = db.prepare("INSERT INTO tweets VALUES(?,?,?,?,?,?,?,?,?,?,?,?);");
        var check = db.prepare("SELECT COUNT(1) AS count FROM tweets WHERE id=?;");
        check.get(t.id, function (err, res) {
            if (res.count === 0) {
                var args = [
                    t.id,
                    t.text,
                    t.author_name,
                    t.user_name,
                    t.profile_url,
                    t.avatar_url,
                    t.tweet_url,
                    t.date_time.week_day,
                    t.date_time.month,
                    t.date_time.date,
                    t.date_time.time,
                    t.date_time.year
                ];
                insert.run(args);
                saveTweet(c+1, tweets);
            }
        });
    }
};

saveTweets = function (tweets) {
    console.log('Recording '+tweets.length+' tweets in the Database.');
    saveTweet(0, tweets);
};

tokenize = function(msg) {
    var query = msg.split(',').join('').split(' ');
    var keywords = [];
    var users = [];

    for(var c = 0; c < query.length; c++) {
        var token = query[c];
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

queryToSQL = function(msg) {
    var sql = "SELECT * FROM tweets WHERE ";
    var args = [];

    var tokens = tokenize(msg);

    var keywords = tokens.keywords;
    var users = tokens.users;

    for(var c = 0; c < keywords.length; c++) {
        if(c > 0) sql += ' ' + keywords[c].pre;
        sql += ' (text LIKE ? OR user_name LIKE ?) ';
        args.push('%' + keywords[c].word + '%');
        args.push('%' + keywords[c].word + '%');
    }

    if(users.length > 0) {
        if(keywords.length !== 0) sql += ' AND ';
        sql += '(';
        for (var c = 0; c < users.length; c++) {
            sql += ' ' + users[c].pre + ' user_name=?';
            args.push(users[c].word);
        }
        sql += ')';
    }

    return { sql: sql, args: args };
};

queryDatabase = function (msg, sendBack) {

    console.log('Retrieving tweets using Database.');

    var processedQuery = queryToSQL(msg);
    var sql = processedQuery.sql;
    var args = processedQuery.args;

    //console.log(sql);
    //console.log(args);

    var results = [];
    db.each(sql, args, function (err, t) {
        if (t !== undefined)
            results.push({
                id: t.id,
                text: t.text,
                author_name: t.author_name,
                user_name: t.user_name,
                profile_url: t.profile_url,
                avatar_url: t.avatar_url,
                tweet_url: t.tweet_url,
                date_time: {
                    week_day: t.week_day,
                    month: t.month,
                    date: t.date,
                    time: t.time,
                    year: t.year
                }
            });
    }, function () {
        sendBack(results);
    });
};

lastUpdated = function(query, callback) {
    var getTime = db.prepare("SELECT time FROM queries WHERE text=?;");
    getTime.get(query, function(err, res) {
        var time = res === undefined? 0 : res.time;
        callback(time);
    });
};

saveQuery = function(query) {
    var timeStamp = Math.floor(Date.now());
    var check = db.prepare("SELECT COUNT(1) AS count FROM queries WHERE text=?;");
    var insert = db.prepare("INSERT INTO queries (text, time) VALUES (?, ?);");
    var update = db.prepare("UPDATE queries SET time=? WHERE text=?;");
    check.get(query, function(err, res) {
        if (res.count === 0) {
            insert.run([query, timeStamp]);
        } else {
            update.run([timeStamp, query]);
        }
    });
};

getPlayerName = function(query, callback) {
    let sql = "SELECT name FROM 'dbpedia_names' WHERE ";
    let queryArr = query.split(" ");
    let args = [];

    for(var i = 0; i < queryArr.length; i++) {
        if(['AND', 'OR', 'BY'].indexOf(queryArr[i] < 0)) {
            if(i > 0) sql += " OR ";
            sql += "key LIKE ?";
            let word = queryArr[i].split('#').join('').split('@').join('');
            args.push('%'+word+'%');
        }
    }
    sql += " LIMIT 1;";

    db.prepare(sql).get(args, (err, res) => {
        callback(res.name);
    });
};

module.exports = {
    initDatabase: initDatabase,
    deleteDatabase: deleteDatabase,
    resetDatabase: resetDatabase,
    saveTweets: saveTweets,
    queryDatabase: queryDatabase,
    saveQuery: saveQuery,
    lastUpdated: lastUpdated,
    tokenize: tokenize,
    getPlayerName: getPlayerName
};