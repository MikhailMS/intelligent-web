/**
 * Created by blagoslav on 19.05.17.
 */
log = function(category, msg) {
    let now = new Date();
    let hrs = now.getHours().toString();
    let mins = now.getMinutes().toString();
    let secs = now.getSeconds().toString();
    if(hrs.length < 2) hrs = '0' + hrs;
    if(mins.length < 2) mins = '0' + mins;
    if(secs.length < 2) secs = '0' + secs;
    let time = hrs + ':' + mins + ':' + secs;
    console.log('['+time+'] '+category+': '+msg);
};

module.exports = {
    log: log
};