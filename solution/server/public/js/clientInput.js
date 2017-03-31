if (io !== undefined) {

  // Storage for WebSocket connections
  var socket = io.connect('/');

  ////////////Handle Input form///////////
  $('#query-form').submit(function() {


    // clear previous results for both tabs
    $(".resultListSearch").empty();
    $(".resultListStream").empty();

    // input boxes
    var playerQuery = $('#playerQuery').val();
    var teamQuery = $('#teamQuery').val();
    var authorQuery = $('#authorQuery').val();

    // toggles
    if ($('#toggle1').parent().hasClass('off'))
      var toggle1 = 'OR'; else toggle1 = 'AND';
    if ($('#toggle2').parent().hasClass('off'))
      var toggle2 = 'OR'; else toggle2 = 'AND';

    console.log('playerQuery', playerQuery);
    console.log('teamQuery', teamQuery);
    console.log('authorQuery', authorQuery);
    console.log('toggle1', toggle1);
    console.log('toggle2', toggle2);

    // create data payload to emit to server
    var payload = {
      playerQuery: playerQuery,
      teamQuery: teamQuery,
      authorQuery: authorQuery,
      toggle1: toggle1,
      toggle2: toggle2
    };
    console.log('payload', payload);

    // emit socket
    socket.emit('client-query', payload); // Send message to server
    return false;
  });

}
