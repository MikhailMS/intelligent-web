/**
 * Created by pbarzev on 31/03/2017.
 */

if (io !== undefined) {
  var socket = io.connect();

  // This listens on the "twitterSearch" channel and data is
  // received every time a new tweet is received.
  socket.on('twitterSearch', function (payload) {
    console.log('Received Payload', payload);
    payload.statuses.forEach(function (el) {
      var tweetText = el.text;
      // console.log('tweetText', tweetText);
      $(".resultListSearch").append("<p>" + tweetText + "</p>");
    });
  });

  // Listens for a success response from the server to
  // say the connection was successful.
  socket.on("connected", function (r) {
    // Now that we are connected to the server let's tell
    // the server we are ready to start receiving tweets.
    socket.emit("start tweets");
  });
}


  //////////////////////// Unimplemented and untested advanced features... client sessions, per-client rendering///////////////////////
  // $("#submit").click(function() {
  //   var data = {};
  //   data['keyword'] = $('#key-word').val();
  //   data['session'] = session;
  //   socket.emit('start-streaming', JSON.stringify(data)); // Send message to server
  // });
  //
  // socket.on('receive-session', function(s) {
  //   session = s;
  // });


  // socket.on('twitter-stream', function(data) {
  //   data = JSON.parse(data);
  //   if (data.msg != null) {
  //     if (session == data['session']) {
  //       $("#resultList").append("<p>" + data['msg'] + "</p>");
  //       //console.log(data.msg);
  //     }
  //   }
  // });