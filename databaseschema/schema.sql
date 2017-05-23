BEGIN TRANSACTION;

CREATE TABLE "tweets" (
	`id`	INTEGER NOT NULL,
	`text`	TEXT,
	`author_name`	TEXT,
	`user_name`	TEXT,
	`profile_url`	TEXT,
	`avatar_url`	TEXT,
	`tweet_url`	TEXT,
	`week_day`	TEXT,
	`month`	TEXT,
	`date`	TEXT,
	`time`	TEXT,
	`year`	TEXT,
	PRIMARY KEY(id)
);

CREATE TABLE `queries` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`text`	TEXT NOT NULL UNIQUE,
	`time`	TIMESTAMP NOT NULL
);

CREATE TABLE `dbpedia_names` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`key`	TEXT NOT NULL UNIQUE,
	`name`	TEXT NOT NULL
);

COMMIT;
