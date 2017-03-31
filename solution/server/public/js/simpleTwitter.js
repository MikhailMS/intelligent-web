if (io !== undefined) {
  // Storage for WebSocket connections
  var socket = io.connect('/');

  // This listens on the "twitter-steam" channel and data is
  // received every time a new tweet is received.


  socket.on('twitter-stream', function(data) {
    if (data.msg != null) {
      if (data.msg.includes("hey")) {
        $("#resultList").append("<p>" + data.msg + "</p>");
        console.log(data.msg);
      }
    }
  });


  // BLAGO
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




  // Listens for a success response from the server to
  // say the connection was successful.
  socket.on("connected", function(r) {
    // Now that we are connected to the server let's tell
    // the server we are ready to start receiving tweets.
    socket.emit("start tweets");
  });
}
