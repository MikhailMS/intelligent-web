
/**
 * Created by pbarzev on 29/03/2017.
 */

if (io !== undefined) {
  var socket = io.connect('/');

  // This listens on the "twitterSearch" channel and data is
  // received every time a new tweet is received.
  socket.on('twitterStream', function(payload) {
    console.log('Received Payload', payload);
    var tweetText = payload.text;
    $(".resultListStream").append("<p>" + tweetText + "</p>");
  });


  // Listens for a success response from the server to
  // say the connection was successful.
  socket.on("connected", function(r) {
    socket.emit("start tweets");
  });
}

