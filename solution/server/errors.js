/**
 * errors.js
 *
 * This file holds the various types
 * of errors that are passed back to
 * the client at different occasions.
 *
 * Written by:  Blagoslav Mihaylov
 * Last updated: 22/05/2017
 */

const INVALID_QUERY = {
    title: 'Server side error',
    msg: 'The query received was of invalid format.'
};

const TWIT_REST = {
    title: 'Twitter API Error',
    msg: 'There was an error retrieving the tweets using the Twitter REST API.'
};

const TWIT_STREAM = {
    title: 'Twitter API Error',
    msg: 'There was an error while streaming using the Twitter API.'

};

const TWIT_EMPTY = {
    title: 'Twitter API Error',
    msg: 'The Twitter API returned 0 tweets for the given query.'
};

const TWIT_RATE_LIM = {
    title: 'Twitter API Error',
    msg: 'Too many stream requests (rate limited).'
};

const DB_GENERIC = {
    title: 'Database error',
    msg: 'There was an error reaching the database.'
};

const DB_EMPTY = {
    title: 'Database error',
    msg: 'No results were found in the database for this query.'
};

module.exports = {
    INVALID_QUERY,
    TWIT_REST,
    TWIT_STREAM,
    TWIT_EMPTY,
    TWIT_RATE_LIM,
    DB_GENERIC,
    DB_EMPTY
};