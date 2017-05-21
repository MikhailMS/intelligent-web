/*created by Mikhail Molotkov
  updated on 21/05/2017
*/
var dbHolder;
var socket;
var host = 'http://a0e660f2.ngrok.io';

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
    onDeviceReady: function() {
      this.overrideAlert();
      this.receivedEvent();
      this.repeatLocationSuggestion(true);
      document.addEventListener("pause", this.onPause, false);
      document.addEventListener("backbutton", this.onBackButton, false);
      // Setup Stream Switch
      this.toggleStreamSwitch(false);
      $("#help-popover").popover({content: "1. Search examples: #hazard OR #chelsea BY @WayneRooney , #chelsea AND @WayneRooney , #manutd , @Rooney\n\n\n 2. To close 'Real-time Tweets' channel once it's opened, press 'back button' or close app\n 3. Allow and turn on GPS to enable query suggestions\n 4. To close this window, press 'Query examples' again."})
      // Setup socket channel
      if(io !== undefined) {
        socket = io.connect(host);
      }
    },

    onBackButton: function() {  // Triggers when user presses 'backbutton'
      app.stopStream();
      app.closeLoadingAnimation();
    },

    onPause: function() {       // Triggers when application is stopped
      app.stopStream();
      app.closeLoadingAnimation();
      app.repeatLocationSuggestion(false);
    },
    // Functions to process user clicks
    onSearchButtonClick: function(e) {
      e.preventDefault();
      if($(".search-tweet").length) {
        $(".search-tweet").remove();
      }
      var $tab = $('#search-tweet-wrapper');
      var query = $('#search-query').val();
      // Check for empty queries
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        app.customToast('Your query is empty. Try again');
        $('#search-query').val("");
      } else {
        $("body").addClass("loading");
        console.log(`Query to Search API ${query}`);
        socket.emit('static-search', { query: query, db_only: false });
        // Once results are prepared and sent by server, process them on client
        if (!(socket.hasListeners('feed-search-result'))) {
          socket.on('feed-search-result', function (error, data) {
            if (data!=null) {
              console.log(`Data received from Twitter Search - ${data.tweets.length}`);
              // Close loading animation
              app.closeLoadingAnimation();
              if (data.tweets.length<=0) {
                app.customToast(`No results found for ${query}`)
              } else {
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
                  // Create div element that holds tweet data
                  $tab.append(`<div id='id_${i}_search' class='search-tweet'><div><a class='search-tweet-author-page' href='${profilePage}'><img class='search-tweet-author-img' alt='profile' src='${profileImg}' /></a><a class='search-tweet-author-link' target="_blank" rel="noopener noreferrer" href='${profilePage}'><span class='search-tweet-author'></span></a></div><div><span class='search-tweet-text'></span></div><div><span class='search-tweet-time'></span><a class='search-tweet-link' target='_blank' rel='noopener noreferrer' href='${link}'>Open tweet</a></div></div>`);
                  var $div = $(`#id_${i}_search`);
                  // Add tweet data to placeholders
                  $div.find('.search-tweet-text').text(tweetText);
                  $div.find('.search-tweet-author').text(authorName);
                  var date_time = `${weekDay}, ${date}.${month}.${year} ${time} GMT`;
                  $div.find('.search-tweet-time').text(date_time);
                  // Append 'tweet div' to 'parent div' element
                  $tab.append($div).toggle().toggle();
                }
                console.log('Saving to DB...')
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
                  // Save tweet to DB
                  app.insertDataToDB(dbHolder, query, tweetText, tweetId, authorName, userName, profileImg, date_time, timestamp);
                }
              }
            } else {
              alert('Error while retrieving results from the server');
            }
          });
        }
        // Listens for a success response from the server to
        // say the connection was successful.
        socket.on("connected", function(r) {
          // Now that we are connected to the server let's tell
          // the server we are ready to start receiving tweets.
          socket.emit("start tweets");
        });
      }
    },

    onStreamButtonClick: function(e) {
      e.preventDefault();
      if($(".stream-tweet").length) {
        $(".stream-tweet").remove();
      }
      var $tab = $('#search-stream-wrapper');
      var query = $('#stream-query').val();
      // Check for empty queries
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        app.customToast('Your query is empty. Try again');
        $('#stream-query').val("");
      } else {
        //$('.toggle.btn.btn-default.off').attr('style', 'width: 100%;height: 60px;')
        $('.toggle.btn.btn-default.off').attr('style', 'display:block');
        console.log(`Query to Stream API ${query}`);
        app.stopStream();
        app.toggleStreamSwitch(true);
        socket.emit('open-stream', query); // Emit search query to Stream API
        var counter = 0;
        // This listens on the "stream-result" channel and data is received everytime a new tweet is receieved.
        socket.on('stream-result', function (error, data) {
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

    onDBButtonClick: function(e) {
      e.preventDefault();
      if($(".db-tweet").length) {
        $(".db-tweet").remove();
      }
      var $tab = $('#search-db-wrapper');
      var query = $('#db-query').val();
      // Check for empty queries
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        app.customToast('Your query is empty. Try again');
        $('#db-query').val("");
      } else {
        $("body").addClass("loading");
        dbHolder.transaction(function (transaction) {
            transaction.executeSql('SELECT * FROM search_query WHERE query=? ORDER BY timestamp DESC', [query],
              function (tx, results) {
                // access with results.rows.item(i).<field>
                console.log(`Data retrieved from DB - ${results.rows.length}`);
                // Close loading animation
                app.closeLoadingAnimation();
                if (results.rows.length===0) {
                  console.log('No results found');
                  app.customToast('No results found');
                  $('#db-query').val("");
                } else {
                  // Extract tweet data
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

    onTabClick: function(e) {
      e.preventDefault();
      if ($(this).hasClass('active')) {
          return;
      }
      var tab = $(this).data('tab');
      if (tab === '#search-realtime-tab') {
        $('.tab-button').removeClass('active');
        $('#search-realtime-tab-button').addClass('active');
        $('#search-tweet-wrapper').attr('style', 'display:none');
        $('#search-db-wrapper').attr('style', 'display:none');
        $('#search-stream-wrapper').attr('style', 'display:block');
      } else if (tab === '#search-db-tab') {
        $('.tab-button').removeClass('active');
        $('#search-db-tab-button').addClass('active');
        $('#search-stream-wrapper').attr('style', 'display:none');
        $('#search-tweet-wrapper').attr('style', 'display:none');
        $('#search-db-wrapper').attr('style', 'display:block');
      } else {
        $('.tab-button').removeClass('active');
        $('#search-tweets-tab-button').addClass('active');
        $('#search-stream-wrapper').attr('style', 'display:none');
        $('#search-db-wrapper').attr('style', 'display:none');
        $('#search-tweet-wrapper').attr('style', 'display:block');
      }
    },

    toggleStreamSwitch: function(check) {
      if (check) {
        $('#stream-switch').bootstrapToggle('enable');
        $('#stream-switch').bootstrapToggle('on');
        $('#stream-switch').bootstrapToggle('disable');
      } else {
        $('#stream-switch').bootstrapToggle('enable');
        $('#stream-switch').bootstrapToggle('off');
        $('#stream-switch').bootstrapToggle('disable');
      }
    },

    // DB initialisation and insert
    initializeDB: function() {
      dbHolder = window.sqlitePlugin.openDatabase({name: "localStorage.db", location: 'default'});
      dbHolder.transaction(function (transaction) {
        transaction.executeSql('CREATE TABLE IF NOT EXISTS search_query (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, query TEXT, text TEXT, id_str TEXT, authorName TEXT, userName TEXT, profileImg TEXT, created_at TEXT, timestamp TEXT, UNIQUE (query, text, authorName, userName))', [],
          function (tx, result) {
            console.log("Table for queries created successfully");
          },
          function (error) {
            console.log(`Error occurred while creating the table - ${error}`);
          });
        transaction.executeSql('CREATE TABLE IF NOT EXISTS city_club_suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, cityName TEXT, footballClubId TEXT, UNIQUE (footballClubId))', [],
          function (tx, result) {
            console.log("Table for extra data created successfully");
          },
          function (error) {
            console.log(`Error occurred while creating the table - ${error}`);
          });

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

    insertDataToDB: function(holder, query, text, id_str, authorName, userName, profileImg, created_at, timestamp) {
      holder.transaction(function(tx) {
        tx.executeSql('INSERT INTO search_query (query, text, id_str, authorName, userName, profileImg, created_at, timestamp) VALUES (?,?,?,?,?,?,?,?)', [query, text, id_str, authorName, userName, profileImg, created_at, timestamp]);
      }, function(error) {
        console.log('Transaction ERROR: ' + error.message);
      }, function() {
        console.log(`Populated database OK ${id_str}`);
      });
    },

    // Stop tweets stream channel
    stopStream: function() {
      console.log('Stop stream is called')
      socket.emit('close-stream', ''); // Close stream once it's not needed
      app.toggleStreamSwitch(false);
    },

    // Close animation
    closeLoadingAnimation: function() {
      if ($("body").hasClass("loading")) {
        $("body").removeClass("loading");
      }
    },

    // Update DOM on a Received Event
    receivedEvent: function() {
      $('.tab-button').on('click', this.onTabClick);
      $("#btn-search-query").on( "click", this.onSearchButtonClick);
      $("#btn-stream-query").on( "click", this.onStreamButtonClick);
      $("#btn-search-db-query").on( "click", this.onDBButtonClick);
      $("#btn-help").on( "click", function() {
        $('[data-toggle="popover"]').popover();
      });
    },

    // Custom alert
    overrideAlert: function() {
      if (navigator.notification) { // Override default HTML alert with native dialog
        window.alert = function (msg) {
          navigator.notification.alert(
            msg,    // message
            null,       // callback
            "Northern Lights Team", // title
            'Continue'        // buttonName
            );
        };
      }
    },

    // Custom toast messages
    customToast: function(msg) {
      window.plugins.toast.showWithOptions( {
          message: msg,
          duration: 2500,
          position: 'center',
          styling: {
            opacity: 0.75, // Default 0.8
            backgroundColor: '#4168C1', // Default #333333
            textColor: '#FFFFFF', // Default #FFFFFF
            textSize: 14.5, // Default is ~ 13.
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

    suggestionToast: function(msg) {
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
    onGetLocation: function(position) {

      var lat = position.coords.latitude;
      var lng = position.coords.longitude;

      var queryString = `http://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&sensor=true`

      $.getJSON(queryString, function (results) {

        if (results.results.length) {

            $.getJSON(queryString, function (results) {

                if (results.results.length) {
                  var addressList = results.results[0].formatted_address.replace(/,/g, '').split(' ');
                  console.log(addressList[addressList.length-4]);
                  if (dbHolder == null) {
                    dbHolder = window.sqlitePlugin.openDatabase({name: "localStorage.db", location: 'default'});
                  }
                  dbHolder.transaction(function (transaction) {
                      transaction.executeSql('SELECT * FROM city_club_suggestions WHERE cityName=?', [addressList[addressList.length-4]],
                        function (tx, results) {
                          // access with results.rows.item(i).<field>
                          console.log(`Data retrieved from DB - ${results.rows.length}`);
                          if (results.rows.length===0) {
                            console.log('No results found');
                          } else {
                            var suggestion = '';
                            for (var i=0;i<results.rows.length;i++) {
                              if ($.inArray(results.rows.item(i).cityName, addressList)>=0) {
                                suggestion += results.rows.item(i).footballClubId + '\n';
                              }
                            }
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

    onGetLocationError: function(error) {
      console.log('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
    },

    // Function repeats location suggestions
    repeatLocationSuggestion: function(repeat) {
      var repeatId;
      var repeatTime = 30*1000 // 30seconds

      if (repeat) {
        var repeatId = window.setInterval(function() {
          navigator.geolocation.getCurrentPosition(app.onGetLocation, app.onGetLocationError, { enableHighAccuracy: true });
        }, repeatTime);
      } else {
        clearInterval(repeatId);
      }
    },
};

app.initialize();
