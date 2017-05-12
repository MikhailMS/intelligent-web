var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('db.sqlite3');

initDatabase = function() {
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
};

deleteDatabase = function() {
    db.run("DROP TABLE 'tweets';");
};

resetDatabase = function() {
    deleteDatabase();
    initDatabase();
};


saveTweets = function(tweets) {
    db.serialize(function() {
        var insert = db.prepare("INSERT INTO tweets VALUES(?,?,?,?,?,?,?,?,?,?,?,?);")
        var check = db.prepare("SELECT COUNT(1) AS count FROM tweets WHERE id=?;")
        tweets.forEach(function(t) {
            check.get(t.id, function(err, res) {
                if(res.count === 0) {
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
                }
            });
        });
    });
};

queryDatabase = function(msg, sendBack) {
    var query = msg.replace(',','').split(' ');
    var sql = "SELECT * FROM tweets WHERE ";
    var args = [];

    for(var c = 0; c < query.length; c++) {
        var keyword = query[c];
        if(keyword !== 'AND' && keyword !== 'OR') {
            if(c !== 0) {
                if(query[c-1] === 'OR')
                    sql += ' OR ';
                else
                    sql += ' AND ';
            }
            sql += "text LIKE ?";
            args.push("% "+keyword+" %");
        }
    }

    var results = [];
    db.each(sql, args, function(err, t) {
        if(t !== undefined)
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
    }, function() {sendBack(results)});
};

module.exports = {
    initDatabase: initDatabase,
    deleteDatabase: deleteDatabase,
    resetDatabase: resetDatabase,
    saveTweets: saveTweets,
    queryDatabase: queryDatabase
};