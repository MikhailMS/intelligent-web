var advance = io.connect('/advance');

$('#button').click(function(){
  //var data = {'key-word': $('#key-word').val(), 'lang': $('#language').val()}
  advance.emit('start-streaming', $('#key-word').val()); // Send message to server
  return false;
});

console.log("dadada");

advance.on('client query', function(data){ // Get message from server
  console.log("client query: "+data.lang);
});
advance.on('connect-made', function(msg) { // Notify users that someone joined the chat
  $('.error').text(msg).fadeIn(400).delay(3000).fadeOut(400);
});
advance.on('disconnect-made', function(msg) { // Notify users that someone left the chat
  $('.error').text(msg).fadeIn(400).delay(3000).fadeOut(400);
});
