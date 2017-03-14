var advance = io.connect('/advance');
$('#query-form').submit(function(){
  var data = {'key-word': $('#key-word').val(), 'lang': $('#language').val()}
  advance.emit('client query', data); // Send message to server
  console.log(data)
  return false;
});
advance.on('client query', function(data){ // Get message from server
  console.log("client query: "+data.lang);
});
advance.on('connect-made', function(msg) { // Notify users that someone joined the chat
  $('.error').text(msg).fadeIn(400).delay(3000).fadeOut(400);
});
advance.on('disconnect-made', function(msg) { // Notify users that someone left the chat
  $('.error').text(msg).fadeIn(400).delay(3000).fadeOut(400);
});
