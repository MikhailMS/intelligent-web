if (io !== undefined) {

  // Storage for WebSocket connections
  var socket = io.connect('/');

  ////////////Handle Input form///////////
  $('#query-form').submit(function () {
    var isValidated = $('input[type="text"]', 'form').filter(function () {
      inputVal = $.trim(this.value)
      return inputVal.length;  //text inputs have a value
    }).length;

    if (isValidated) {
      // clear previous results for both tabs
      $(".resultListSearch").empty();
      $(".resultListStream").empty();

      // input boxes
      var playerQuery = $('#playerQuery').val();
      var teamQuery = $('#teamQuery').val();
      var authorQuery = $('#authorQuery').val();

      // toggles
      if ($('#toggle1').parent().hasClass('off'))
        var toggle1 = 'OR'; else var toggle1 = 'AND';
      if ($('#toggle2').parent().hasClass('off'))
        var toggle2 = 'OR'; else var toggle2 = 'AND';

      // data payload to emit to server
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
    }
  });

}
