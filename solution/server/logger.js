/**
 * logger.js
 *
 * Used to log output to the console.
 *
 * Written by:  Blagoslav Mihaylov
 * Last updated: 19/05/2017
 */

/**
 * Returns a string with the current
 * time (hrs:mins:secs).
 *
 * @returns {string}
 */
function getTimeStamp() {
    //get hrs, mins, secs
    let now = new Date();
    let hrs = now.getHours().toString();
    let mins = now.getMinutes().toString();
    let secs = now.getSeconds().toString();

    //add on a zero if single-digit
    if(hrs.length < 2) hrs = '0' + hrs;
    if(mins.length < 2) mins = '0' + mins;
    if(secs.length < 2) secs = '0' + secs;

    return hrs + ':' + mins + ':' + secs;
}

/**
 * Used to log info to the server
 * console.
 *
 * @param category - what the message relates to
 * @param msg - message to be logged
 */
log = function(category, msg) {
    let time = getTimeStamp();
    console.log('['+time+'] '+category+': '+msg);
};

module.exports = { log };