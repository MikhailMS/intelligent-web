if (io !== undefined) {
  // Storage for WebSocket connections
  var socket = io.connect('/');

  $('#query-form').submit(function() {
    var data = { 'keyWord': $('#key-word').val(), 'lang': $('#language').val() }
    socket.emit('client-query', data); // Send message to server
    console.log('clientInput DATA', data);
    return false;
  });
  socket.on('client-query', function(data) { // Get message from server
    console.log("client query: " + data.lang);
  });
  socket.on('connect-made', function(msg) { // Notify users that someone joined
    $('.error').text(msg).fadeIn(400).delay(3000).fadeOut(400);
  });
  socket.on('disconnect-made', function(msg) { // Notify users that someone left
    $('.error').text(msg).fadeIn(400).delay(3000).fadeOut(400);
  });
}