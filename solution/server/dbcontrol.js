var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('db.sqlite3');

module.exports = {
    initDatabase: function() {
        db.serialize(function() {
            db.run("CREATE TABLE `queries` ("+
                "`content`	TEXT NOT NULL UNIQUE"+
            ");");
            db.run("CREATE TABLE `tweets` ("+
                "`content`	TEXT NOT NULL,"+
                "`query_id`	INTEGER NOT NULL"+
            ");");
        })
    },
    cacheTweets: function (query, tweets) {
        db.serialize(function () {
            var stmt = db.prepare('INSERT INTO queries VALUES (?)');
            stmt.run(query);

            stmt = db.prepare('INSERT INTO tweets VALUES (?, 0)');
            for(var tweet in tweets)
                stmt.run(tweets[tweet]);

            stmt.finalize();
        });

    },
    getTweets: function(query) {
        var result = [];
        db.each('SELECT content FROM tweets', function(err, row) {
            result.push(row.content);
        }, function() {return result});

        return result;
    }
};