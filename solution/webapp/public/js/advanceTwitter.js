// Setup Google Map
var myLatlng = new google.maps.LatLng(53.9045,27.5615);
var mapOptions = {
  zoom: 3,
  center: myLatlng,
  mapTypeId: google.maps.MapTypeId.TERRAIN,
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
    position: google.maps.ControlPosition.LEFT_BOTTOM
  }
};
var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

// Get user input and process it
$('#query-form').submit(function(){

  // Setup heat map and link to Twitter array we will append data to
  var heatmap;
  var liveTweets = new google.maps.MVCArray();
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: liveTweets,
    radius: 25
  });
  heatmap.setMap(map);

  var keyWord = $('#key-word').val();
  var language = $('#language').val();

  var search  = new RegExp(keyWord);
  switch (language) {
    case 'English':
      language = 'en';
      break;
    case 'French':
      language = 'fr';
      break;
    case 'Japanese':
      language = 'ja';
      break;
    case 'Russian':
      language = 'ru';
      break;
  }

  console.log(keyWord);
  console.log(language);
  //console.log(search);

  if(io !== undefined) {
      // Storage for WebSocket connections
      var socket = io.connect('/');

      // This listens on the "twitter-steam" channel and data is
      // received everytime a new tweet is receieved.
      socket.on('twitter-stream', function (data) {

        console.log(data.msg!==null);
        //Add tweet to the heat map array.
        if (data.lng!==null && data.lat!==null && data.msg!==null) {
          var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
          liveTweets.push(tweetLocation);
        }
        //Flash a dot onto the map quickly
        var image = "../images/small-dot-icon.png";
        var marker = new google.maps.Marker({
          position: tweetLocation,
          map: map,
          icon: image
        });
        setTimeout(function(){
          marker.setMap(null);
        },1000);

      });

      // Listens for a success response from the server to
      // say the connection was successful.
      socket.on("connected", function(r) {
        // Now that we are connected to the server let's tell
        // the server we are ready to start receiving tweets.
        socket.emit("start tweets");
      });
  }

  return false;
});
