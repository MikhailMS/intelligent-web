/*created by Mikhail Molotkov
  updated on 22/05/2017
*/
var dbHolder;
var socket;
var host = 'http://c91931d5.ngrok.io';

var app = {
    // Initialise application
    initialize: function() {
      if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
          document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
          document.addEventListener('deviceready', this.initializeDB);
      } else {
          this.onDeviceReady();
          this.initializeDB();
      }
    },

    // Events Handler for deviceready
    onDeviceReady: function() {                  // Triggers when application is loaded
      this.overrideAlert();                    // Override default browser alerts
      this.receivedEvent();                    // Bind DOM events listener
      //this.repeatLocationSuggestion(true);     // Start suggestions
      document.addEventListener("pause", this.onPause, false);
      document.addEventListener("backbutton", this.onBackButton, false);
      // Setup Stream Switch
      this.toggleStreamSwitch(false);
      // Setup text in the popover menu
      $("#help-popover").popover({container: 'body',
                                  html: true,
                                  content: "<ul style='list-style: none; margin-left: -25px'><li class='popover-item'>1. Search examples: #hazard OR #chelsea BY @WayneRooney , #chelsea AND @WayneRooney , #manutd , @Rooney</li><li class='popover-item'>2. To close 'Real-time Tweets' channel once it's opened, press 'back button' or close app</li><li class='popover-item'>3. Allow and turn on GPS to enable query suggestions</li><li class='popover-item'>4. To close this window, press 'Query examples' again</li></ul>"})
      // Setup socket channel
      if(io !== undefined) {
        socket = io.connect(host);
      }
    },

    onBackButton: function() {                   // Triggers when user presses 'backbutton'
      app.stopStream();             // Close stream channel if one exists
      app.closeLoadingAnimation();  // Close loading animation if one exists
    },

    onPause: function() {                        // Triggers when application is stopped
      app.stopStream();                     // Close stream channel, if one exists
      app.closeLoadingAnimation();          // Close loading animation, if one exists
      app.repeatLocationSuggestion(false);  // Stop location suggestions
    },

    // Functions to process user clicks
    onSearchButtonClick: function(e) {           // Triggers when user clicks search button in 'Search Tweets' tab
      e.preventDefault();
      var $tab = $('#search-tweet-wrapper');  // Get parent element, where we would append tweet cards
      var query = $('#search-query').val();   // Get search query
      // Check for empty queries
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        app.customToast('Your query is empty. Try again');
        $('#search-query').val("");
      } else {
        // If previously fetched data is on the screen, delete it
        if ($(".search-tweet").length) {
          $(".search-tweet").remove();
        }
        app.togglePlayerInfoBtn(false); // Hide player's content button and collapsible div
        $("body").addClass("loading");  // Start loading animation
        console.log(`Query to Search API ${query}`);
        // Emit search query to server
        socket.emit('static-search', { query: query, db_only: false });
        // Check if channel has been created so only 1 listener per client exists
        if (!(socket.hasListeners('feed-search-result'))) {
          // Once results are prepared and sent by server, process them on client
          socket.on('feed-search-result', function (error, data) {
            if (data!=null) {
              console.log(`Data received from Twitter Search - ${data.tweets.length}`);
              // Close loading animation
              app.closeLoadingAnimation();
              if (data.tweets.length<=0) {
                var msg = `No results found for ${query}`;
                console.log(msg);
                app.customToast(msg);
                $('#search-query').val("");
              } else {
                console.log('Processing tweets and saving them to DB...')
                // Check if DB connection is opened and open if it's needed
                if (dbHolder == null) {
                  dbHolder = window.sqlitePlugin.openDatabase({name: "localStorage.db", location: 'default'});
                }
                for (var i = 0, len = data.tweets.length; i < len; i++) {
                  // Extract tweet data
                  var tweetText = data.tweets[i].text
                  var tweetId = data.tweets[i].id;
                  var authorName = data.tweets[i].author_name
                  var userName = data.tweets[i].user_name
                  var profilePage = data.tweets[i].profile_url;
                  var link = data.tweets[i].tweet_url;
                  var profileImg = data.tweets[i].avatar_url;
                  var timeDateList = data.tweets[i].date_time;
                  // Split received date for custom design
                  var weekDay = timeDateList.week_day;
                  var month = timeDateList.month;
                  var date = timeDateList.date;
                  var time = timeDateList.time;
                  var year = timeDateList.year;
                  // Get timestamp
                  var timestamp = Date.parse(`${year}-${month}-${date} ${time}+0000`)/1000
                  var date_time = `${weekDay}, ${date}.${month}.${year} ${time} GMT`;
                  // Create div element that holds tweet data
                  $tab.append(`<div id='id_${i}_search' class='search-tweet'><div><a class='search-tweet-author-page' href='${profilePage}'><img class='search-tweet-author-img' alt='profile' src='${profileImg}' /></a><a class='search-tweet-author-link' target="_blank" rel="noopener noreferrer" href='${profilePage}'><span class='search-tweet-author'></span></a></div><div><span class='search-tweet-text'></span></div><div><span class='search-tweet-time'></span><a class='search-tweet-link' target='_blank' rel='noopener noreferrer' href='${link}'>Open tweet</a></div></div>`);
                  var $div = $(`#id_${i}_search`);
                  // Add tweet data into placeholders
                  $div.find('.search-tweet-text').text(tweetText);
                  $div.find('.search-tweet-author').text(authorName);
                  var date_time = `${weekDay}, ${date}.${month}.${year} ${time} GMT`;
                  $div.find('.search-tweet-time').text(date_time);
                  // Append 'tweet div' to 'parent div' element
                  $tab.append($div).toggle().toggle();
                  // Save tweet to DB
                  app.insertDataToDB(dbHolder, query, tweetText, tweetId, authorName, userName, profileImg, date_time, timestamp);
                }
              }
            } else {
              alert('Error while retrieving results from the server');
            }
          });
        }
        // Check if channel has been created so only 1 listener per client exists
        if (!(socket.hasListeners('player-card-result'))) {
          socket.on('player-card-result', function (error, data) {
            if (data!=null) {
              console.log(`Data received from Twitter Search - ${data.length}`);
              if (data.length<=0) {
                console.log(`No player found for ${query}`)
              } else {
                console.log("Displaying player's info")
                // Process player's data
                var playerName = data.fullname;
                var playerAbstract = data.abstract;
                var playerPosition = data.position;
                var playerClub = data.current_club;
                var playerPhoto = data.thumbnail_url;
                // Insert data into placeholders
                var $div = $('.player-wrapper');
                // Add player's data into placeholders
                $div.find('.player-photo-link').attr('href', `${playerPhoto}`);
                $div.find('.player-photo').attr('src', `${playerPhoto}`);
                $div.find('.player-name').text(playerName);
                $div.find('.player-club').text(playerClub);
                $div.find('.player-position').text(playerPosition);
                $div.find('.player-abstract').text(playerAbstract);
                app.togglePlayerInfoBtn(true); // Present player's content button and collapsible div
                }
            } else {
              alert('Error while retrieving results from the server');
            }
          });
        }
      }
    },

    onStreamButtonClick: function(e) {           // Triggers when user clicks search button in 'Realtime Tweets' tab
      e.preventDefault();
      var $tab = $('#search-stream-wrapper'); // Get parent element, where we would append tweet cards
      var query = $('#stream-query').val();   // Get search query
      // Check for empty queries
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        app.customToast('Your query is empty. Try again');
        $('#stream-query').val("");
      } else {
        // If previously fetched data is on the screen, delete it
        if($(".stream-tweet").length) {
          $(".stream-tweet").remove();
        }
        $('.toggle.btn.btn-default.off').attr('style', 'display:block');
        console.log(`Query to Stream API ${query}`);
        app.stopStream();
        app.toggleStreamSwitch(true);
        // Emit search query to Stream API
        socket.emit('open-stream', query);
        var counter = 0;
        // Listen to the "stream-result" channel
        socket.on('stream-result', function (error, data) {
          // Data is received everytime a new tweet is issued by server.
          if (data!=null) {
            console.log('Data received from Twitter Stream');
            // Close loading animation
            app.closeLoadingAnimation();
            // Extract tweet data
            var tweetText = data.text
            var tweetId = data.id;
            var authorName = data.author_name
            var userName = data.user_name
            var profilePage = data.profile_url;
            var link = data.tweet_url;
            var profileImg = data.avatar_url;
            var timeDateList = data.date_time;
            // Split received date for custom design
            var weekDay = timeDateList.week_day;
            var month = timeDateList.month;
            var date = timeDateList.date;
            var time = timeDateList.time;
            var year = timeDateList.year;
            // Create div element that holds tweet data
            $tab.append(`<div id='id_${counter}_stream' class='stream-tweet'><div><a class='stream-tweet-author-page' href='${profilePage}'><img class='stream-tweet-author-img' alt='profile' src='${profileImg}' /></a><a class='stream-tweet-author-link' target="_blank" rel="noopener noreferrer" href='${profilePage}'><span class='stream-tweet-author'></span></a></div><div><span class='stream-tweet-text'></span></div><div><span class='stream-tweet-time'></span><a class='stream-tweet-link' target='_blank' rel='noopener noreferrer' href='${link}'>Open tweet</a></div></div>`);
            var $div = $(`#id_${counter}_stream`);
            // Add tweet data to placeholders
            $div.find('.stream-tweet-text').text(tweetText);
            $div.find('.stream-tweet-author').text(authorName);
            var date_time = `${weekDay}, ${date}.${month}.${year} ${time} GMT`;
            $div.find('.stream-tweet-time').text(date_time);
            // Append 'tweet div' to 'parent div' element
            $tab.append($div).toggle().toggle();
            //$($div).insertBefore('.stream-tweet').toggle().toggle(); // Append on top of previous tweet [Redundant?]
            counter++;
          } else {
            alert('Error while retrieving results from the server');
            app.stopStream();
            app.toggleStreamSwitch(true);
          }
        });

        // Listens for a success response from the server to
        // say the connection was successful.
        socket.on("connected", function(r) {
          // Now that we are connected to the server let's tell
          // the server we are ready to start receiving tweets.
          socket.emit("start tweets");
        });
      }
    },

    onDBButtonClick: function(e) {               // Triggers when user clicks search button in 'Search Database' tab
      e.preventDefault();
      var $tab = $('#search-db-wrapper'); // Get parent element, where we would append tweet cards
      var query = $('#db-query').val();   // Get search query
      // Check for empty queries
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        app.customToast('Your query is empty. Try again');
        $('#db-query').val("");
      } else {
        // If previously fetched data is on the screen, delete it
        if($(".db-tweet").length) {
          $(".db-tweet").remove();
        }
        $("body").addClass("loading");  // Start loading animation
        dbHolder.transaction(function (transaction) {
            transaction.executeSql('SELECT * FROM search_query WHERE query=? ORDER BY timestamp DESC', [query],
              function (tx, results) {
                // access with results.rows.item(i).<field>
                console.log(`Data retrieved from DB - ${results.rows.length}`);
                // Close loading animation
                app.closeLoadingAnimation();
                if (results.rows.length===0) {
                  console.log('No results found');
                  app.customToast(`No results found in DB for ${query}`);
                  $('#db-query').val("");
                } else {
                  // Extract and display tweet data
                  for (var i = 0, len = results.rows.length; i < len; i++) {
                    var tweetText = results.rows.item(i).text
                    var tweetId = results.rows.item(i).id_str;
                    var authorName = results.rows.item(i).authorName
                    var userName = results.rows.item(i).userName
                    var profilePage = `http://twitter.com/${userName}`;
                    var link = `http://twitter.com/anyuser/status/${tweetId}`;
                    var profileImg = results.rows.item(i).profileImg;
                    var timeDate = results.rows.item(i).created_at;
                    // Create div element that holds tweet data
                    $tab.append(`<div id='id_${i}_db' class='db-tweet'><div><a class='db-tweet-author-page' href='${profilePage}'><img class='db-tweet-author-img' alt='profile' src='${profileImg}' /></a><a class='db-tweet-author-link' target="_blank" rel="noopener noreferrer" href='${profilePage}'><span class='db-tweet-author'></span></a></div><div><span class='db-tweet-text'></span></div><div><span class='db-tweet-time'></span><a class='db-tweet-link' target='_blank' rel='noopener noreferrer' href='${link}'>Open tweet</a></div></div>`);
                    var $div = $(`#id_${i}_db`);
                    // Add tweet data to placeholders
                    $div.find('.db-tweet-text').text(tweetText);
                    $div.find('.db-tweet-author').text(authorName);
                    $div.find('.db-tweet-time').text(timeDate);
                    // Append 'tweet div' to 'parent div' element
                    $tab.append($div).toggle().toggle();
                  }
                }
             }, function(error) {
                  console.log(`Transaction ERROR: ${error.message}`);
                  alert(`Transaction ERROR: ${error.message}`);
            });
        });
      }
    },

    onTabClick: function(e) {                    // Triggers when user clicks any of the tabs
      e.preventDefault();
      if ($(this).hasClass('active')) {
          return;
      }
      var tab = $(this).data('tab');
      if (tab === '#search-realtime-tab') {   // If 'Realtime Tweets' tab is clicked
        // Make 'Realtime Tweets' tab active, display content of that tab and hide other tabs
        $('.tab-button').removeClass('active');
        $('#search-realtime-tab-button').addClass('active');
        $('#search-tweet-wrapper').attr('style', 'display:none');
        $('#search-db-wrapper').attr('style', 'display:none');
        $('#search-stream-wrapper').attr('style', 'display:block');
      } else if (tab === '#search-db-tab') {  // If 'Search Database' tab is clicked
        // Make 'Search Database' tab active, display content of that tab and hide other tabs
        $('.tab-button').removeClass('active');
        $('#search-db-tab-button').addClass('active');
        $('#search-stream-wrapper').attr('style', 'display:none');
        $('#search-tweet-wrapper').attr('style', 'display:none');
        $('#search-db-wrapper').attr('style', 'display:block');
      } else {                                // If 'Search Tweets' tab is clicked
        // Make 'Search Tweets' tab active, display content of that tab and hide other tabs
        $('.tab-button').removeClass('active');
        $('#search-tweets-tab-button').addClass('active');
        $('#search-stream-wrapper').attr('style', 'display:none');
        $('#search-db-wrapper').attr('style', 'display:none');
        $('#search-tweet-wrapper').attr('style', 'display:block');
      }
    },

    toggleStreamSwitch: function(check) {        // Triggers when state of the stream channel changes
      if (check) {
        // If stream is on, then toggle switch to inform user, that stream channel is on
        $('#stream-switch').bootstrapToggle('enable');
        $('#stream-switch').bootstrapToggle('on');
        $('#stream-switch').bootstrapToggle('disable');
      } else {
        // If stream is off, then toggle switch to inform user, that stream channel is off
        $('#stream-switch').bootstrapToggle('enable');
        $('#stream-switch').bootstrapToggle('off');
        $('#stream-switch').bootstrapToggle('disable');
      }
    },

    togglePlayerInfoBtn: function(is_on) {       // Triggers when application receives player's data
      if (is_on) {  // If there is a data, then show button and collapsible div
        $(".btn.btn-default.player-btn").attr('style', 'display:block');
        $('.player-wrapper').attr('style', 'display:block').toggle().toggle();
      } else {      // If there is no data or user performs new search, hide button and collapsible div
        $(".btn.btn-default.player-btn").attr('style', 'display:none');
        $('.player-wrapper').attr('style', 'display:none').toggle().toggle();
      }
    },

    // DB initialisation and insert
    initializeDB: function() {                   // Triggers when application is loaded
      dbHolder = window.sqlitePlugin.openDatabase({name: "localStorage.db", location: 'default'});
      dbHolder.transaction(function (transaction) {
        // Create table, that stores tweets
        transaction.executeSql('CREATE TABLE IF NOT EXISTS search_query (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, query TEXT, text TEXT, id_str TEXT, authorName TEXT, userName TEXT, profileImg TEXT, created_at TEXT, timestamp TEXT, UNIQUE (query, text, authorName, userName))', [],
          function (tx, result) {
            console.log("Table for queries created successfully");
          },
          function (error) {
            console.log(`Error occurred while creating the table - ${error}`);
          });
        // Create table, that stores extra information, used for geolocation suggestions
        transaction.executeSql('CREATE TABLE IF NOT EXISTS city_club_suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, cityName TEXT, footballClubId TEXT, UNIQUE (footballClubId))', [],
          function (tx, result) {
            console.log("Table for extra data created successfully");
          },
          function (error) {
            console.log(`Error occurred while creating the table - ${error}`);
          });
        // Populate city_club_suggestions table with initial data set
        transaction.executeSql('INSERT INTO city_club_suggestions (cityName, footballClubId) VALUES (?,?)', ['Sheffield', '@swfc'],
          function (tx, result) {
            console.log(`Populated database OK ${result}`);
          },
          function (error) {
            console.log(`Transaction ERROR:  - ${error.message}`);
          });
          transaction.executeSql('INSERT INTO city_club_suggestions (cityName, footballClubId) VALUES (?,?)', ['Sheffield', '@SUFC_tweets'],
            function (tx, result) {
              console.log(`Populated database OK ${result}`);
            },
            function (error) {
              console.log(`Transaction ERROR:  - ${error}`);
            });
          transaction.executeSql('INSERT INTO city_club_suggestions (cityName, footballClubId) VALUES (?,?)', ['Manchester', '@ManUtd'],
            function (tx, result) {
              console.log(`Populated database OK ${result}`);
            },
            function (error) {
              console.log(`Transaction ERROR:  - ${error}`);
            });
          transaction.executeSql('INSERT INTO city_club_suggestions (cityName, footballClubId) VALUES (?,?)', ['Manchester', '@ManCity'],
            function (tx, result) {
              console.log(`Populated database OK ${result}`);
            },
            function (error) {
              console.log(`Transaction ERROR:  - ${error}`);
            });
          transaction.executeSql('INSERT INTO city_club_suggestions (cityName, footballClubId) VALUES (?,?)', ['Liverpool', '@LFC'],
            function (tx, result) {
              console.log(`Populated database OK ${result}`);
            },
            function (error) {
              console.log(`Transaction ERROR:  - ${error}`);
            });

      });
    },

    insertDataToDB: function(holder, query, text, id_str, authorName, userName, profileImg, created_at, timestamp) { // Triggers when data is received in 'Search Tweets' tab
      // Insert tweet into table
      holder.transaction(function(tx) {
        tx.executeSql('INSERT INTO search_query (query, text, id_str, authorName, userName, profileImg, created_at, timestamp) VALUES (?,?,?,?,?,?,?,?)', [query, text, id_str, authorName, userName, profileImg, created_at, timestamp]);
      }, function(error) {
        console.log('Transaction ERROR: ' + error.message);
      }, function() {
        console.log(`Populated database OK ${id_str}`);
      });
    },

    // Stop tweets stream channel
    stopStream: function() {                     // Triggers when user closes application or presses 'backbutton'
      console.log('Stop stream is called')
      socket.emit('close-stream', '');  // Close stream once it's not needed
      app.toggleStreamSwitch(false);    // Toogle stream switch, to inform user, that stream channel is off
    },

    // Close animation
    closeLoadingAnimation: function() {          // Triggers when data is loaded or when user closes application or presses 'backbutton'
      if ($("body").hasClass("loading")) {  // If animation is running
        $("body").removeClass("loading");   // Then stop it and hide
      }
    },

    // Update DOM on a Received Event
    receivedEvent: function() {                  // Triggers when application receives DOM events
      $('.tab-button').on('click', this.onTabClick);                  // When user clicks any of the tabs
      $("#btn-search-query").on( "click", this.onSearchButtonClick);  // When user clicks search button in 'Search Tweets' tab
      $("#btn-stream-query").on( "click", this.onStreamButtonClick);  // When user clicks search button in 'Realtime Tweets' tab
      $("#btn-search-db-query").on( "click", this.onDBButtonClick);   // When user clicks search button in 'Search Database' tab
      $("#btn-help").on( "click", function() {                        // When user clicks 'Application help' button
        $('[data-toggle="popover"]').popover(); // Toggle help menu
      });
    },

    // Custom alert
    overrideAlert: function() {                  // Triggers when application encounters errors
      if (navigator.notification) { // Override default browser alert with native dialog
        window.alert = function (msg) {
          navigator.notification.alert(
            msg,    // Message
            null,       // Callback
            "Northern Lights Team", // Title
            'Continue'        // Button name
            );
        };
      }
    },

    // Custom toast messages
    customToast: function(msg) {                 // Triggers when user performes wrong action
      window.plugins.toast.showWithOptions( {
          message: msg,
          duration: 2500,
          position: 'center',
          styling: {
            opacity: 0.95, // Default 0.8
            backgroundColor: '#4168C1', // Default #333333
            textColor: '#FFFFFF', // Default #FFFFFF
            textSize: 16.5, // Default is ~ 13.
            cornerRadius: 16, // iOS default 20, Android default 100
            horizontalPadding: 20, // iOS default 16, Android default 50
            verticalPadding: 16 // iOS default 12, Android default 30
          }
        },
        function(a) {     // Success
          console.log('toast success: ' + a)},
        function(error) { // Error
          alert('toast error: ' + error)
        });
    },

    suggestionToast: function(msg) {             // Triggers at the specified time period
      window.plugins.toast.showWithOptions( {
          message: msg,
          duration: 5500,
          position: 'top',
          styling: {
            opacity: 0.95, // Default 0.8
            backgroundColor: '#92a8d1', // Default #333333
            textColor: '#FFFFFF', // Default #FFFFFF
            textSize: 16.5, // Default is ~ 13.
            cornerRadius: 16, // iOS default 20, Android default 100
            horizontalPadding: 20, // iOS default 16, Android default 50
            verticalPadding: 16 // iOS default 12, Android default 30
          }
        },
        function(a) {     // Success
          console.log('toast success: ' + a)},
        function(error) { // Error
          alert('toast error: ' + error)
        });
    },

    // Functions to hanlde user's location
    onGetLocation: function(position) {          // Triggers if user allowed application to use device's GPS and turned on GPS

      var lat = position.coords.latitude;   // Get user's latitude
      var lng = position.coords.longitude;  // Get user's longitude

      // Create a query to Google Maps API
      var queryString = `http://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&sensor=true`

      // Send query to obtain user's address
      $.getJSON(queryString, function (results) {

        if (results.results.length) {

            $.getJSON(queryString, function (results) {

                if (results.results.length) {
                  var addressList = results.results[0].formatted_address.replace(/,/g, '').split(' ');
                  console.log(addressList);
                  console.log(`City name: ${addressList[addressList.length-4]}`);
                  if (dbHolder == null) {
                    dbHolder = window.sqlitePlugin.openDatabase({name: "localStorage.db", location: 'default'});
                  }
                  // Search city_club_suggestions table for a match in cityName
                  dbHolder.transaction(function (transaction) {
                      transaction.executeSql('SELECT * FROM city_club_suggestions WHERE cityName=?', [addressList[addressList.length-4]],
                        function (tx, results) {
                          // access with results.rows.item(i).<field>
                          console.log(`Data retrieved from DB - ${results.rows.length}`);
                          if (results.rows.length===0) {
                            console.log('No results found');
                          } else {
                            // If there is a match, then create suggestion
                            var suggestion = '';
                            for (var i=0;i<results.rows.length;i++) {
                              if ($.inArray(results.rows.item(i).cityName, addressList)>=0) {
                                suggestion += results.rows.item(i).footballClubId + '\n';
                              }
                            }
                            // Display suggestion to the user
                            app.suggestionToast(`According to your location, following \n search queries are recommended:\n${suggestion}`);
                          }
                       }, function(error) {
                            console.log(`Transaction ERROR: ${error.message}`);
                      });
                  });
                } else {
                  console.log("No address available for user's location");
                }

            });
        } else {
          console.log('Location is in wrong format');
        }
      }).fail(function () {
          console.log("Error getting location");
        });
    },

    onGetLocationError: function(error) {        // Triggers if location cannot be detected
      console.log('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
    },

    // Function repeats location suggestions
    repeatLocationSuggestion: function(repeat) { // Triggers once application is loaded
      var repeatId;             // Variable stores setInterval ID
      var repeatTime = 30*1000  // 30 seconds

      if (repeat) { // If True, then start repeating
        var repeatId = window.setInterval(function() {  // Repeat getCurrentPosition to suggest queries to user
          navigator.geolocation.getCurrentPosition(app.onGetLocation, app.onGetLocationError, { enableHighAccuracy: true });
        }, repeatTime);
      } else {      // If False, then stop repeating
        clearInterval(repeatId);
      }
    },
};

app.initialize();
