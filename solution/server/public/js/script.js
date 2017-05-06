/**
 * Created by blagoslav on 06.05.17.
 */

//load client-end socket.io
if(socket === undefined) var socket = io();

$(document).ready(function() {

    var searchResult = $('#search-result');
    var streamResult = $('#stream-result');
    var searchButton = $('#search-button');
    var searchTab = $('#search-tab');
    var streamTab = $('#stream-tab');
    var inputField = $('#query-field');

    var query = '';
    var searchUpdated = true;
    var streamUpdated = true;

    var submitQuery = function() {
        query = inputField.val();
        searchUpdated = false;
        streamUpdated = false;
        if(searchTab.parent().hasClass('active'))
            updateSearch();
        else if(streamTab.parent().hasClass('active'))
            updateStream();
    };

    var updateSearch = function() {
        if (!searchUpdated) {
            searchResult.empty();
            console.log("dsada");
            socket.emit('search-query', query);
            searchUpdated = true;
        }
    }

    var updateStream = function() {
        if (!streamUpdated) {
            streamResult.empty();
            socket.emit('stream-query', query);
            streamUpdated = true;
        }
    }

    searchButton.click(submitQuery);
    searchTab.click(updateSearch);
    streamTab.click(updateStream);

    socket.on('search-result', function (data) {
        tweets = data['statuses'];
        for (var tweet in tweets)
            searchResult.append("<p>" + tweets[tweet].text + "</p>");
    });

    socket.on('stream-result', function (tweet) {
        streamResult.append("<p>" + tweet.text + "</p>");
    });
});
