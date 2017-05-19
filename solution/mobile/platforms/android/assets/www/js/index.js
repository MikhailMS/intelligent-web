/*created by Mikhail Molotkov
  updated on 19/05/2017
*/
var dbHolder;
var socket;
var host = 'http://4e10894e.ngrok.io';
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
      document.addEventListener("pause", this.stopStream, false);
      document.addEventListener("pause", this.closeLoadingAnimation, false);
      document.addEventListener("backbutton", this.stopStream, false);
      document.addEventListener("backbutton", this.closeLoadingAnimation, false);
      // Setup Stream Switch
      this.toggleStreamSwitch(false);
      // Setup socket channel
      if(io !== undefined) {
        socket = io.connect(host);
      }
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
        alert('Type in your query');
        $('#search-query').val("");
      } else {
        $("body").addClass("loading");
        console.log(`Query to Search API ${query}`);
        socket.emit('search-query', { query: query, db_only: false });
        // Once results are prepared and sent by server, process them on client
        if (!(socket.hasListeners('feed-search-result'))) {
          socket.on('feed-search-result', function (data) {
            if (data!=null) {
              console.log('Data received from Twitter Search');
              // Close loading animation
              app.closeLoadingAnimation();
              if (data.length<=0) {
                alert(`No results found for ${query}`)
              } else {
                for (var i = 0, len = data.length; i < len; i++) {
                  // Extract tweet data
                  var tweetText = data[i].text
                  var tweetId = data[i].id;
                  var authorName = data[i].author_name
                  var userName = data[i].user_name
                  var profilePage = data[i].profile_url;
                  var link = data[i].tweet_url;
                  var profileImg = data[i].avatar_url;
                  var timeDateList = data[i].date_time;
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
                for (var i = 0, len = data.length; i < len; i++) {
                  // Extract tweet data
                  var tweetText = data[i].text
                  var tweetId = data[i].id;
                  var authorName = data[i].author_name
                  var userName = data[i].user_name
                  var profilePage = data[i].profile_url;
                  var link = data[i].tweet_url;
                  var profileImg = data[i].avatar_url;
                  var timeDateList = data[i].date_time;
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
        alert('Type in your query');
        $('#stream-query').val("");
      } else {
        //$('.toggle.btn.btn-default.off').attr('style', 'width: 100%;height: 60px;')
        $('.toggle.btn.btn-default.off').attr('style', 'display:block');
        console.log(`Query to Stream API ${query}`);
        app.stopStream();
        app.toggleStreamSwitch(true);
        socket.emit('stream-query', query); // Emit search query to Stream API
        var counter = 0;
        // This listens on the "stream-result" channel and data is received everytime a new tweet is receieved.
        socket.on('stream-result', function (data) {
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
            console.log('no data');
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
        alert('Type in your query');
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
                  alert('No results found');
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
                  console.log("Table created successfully");
              },
              function (error) {
                  console.log(`Error occurred while creating the table - ${error}`);
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
};

app.initialize();
