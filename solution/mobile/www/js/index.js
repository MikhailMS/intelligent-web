/*created by Mikhail Molotkov
  updated on 17/05/2017
*/
var dbHolder;
var host = '';
var app = {
    // Initialise application
    initialize: function() {
      if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
          document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
          document.addEventListener('deviceready', this.initializeDB);
      } else {
          this.onDeviceReady();
      }
    },

    // Event Handler for deviceready
    onDeviceReady: function() {
      this.overrideBrowserAlert();
      this.receivedEvent('deviceready');
      document.addEventListener("pause", this.stopStream, false);
    },

    // Functions to process user clicks
    onSearchButtonClick: function(e) {
      e.preventDefault();
      if($(".search-tweet").length) {
        $(".search-tweet").remove();
      }
      var $tab = $('#search-tweet-wrapper');
      var query = $('#search-query').val();
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        alert('Type in your query');
        $('#search-query').val("");
      } else {
        $("body").addClass("loading");
        console.log(`Query to Search API ${query}`);
        if(io !== undefined) {
          // Storage for WebSocket connections
          var socket = io.connect(host);

          // Emit search query to Search API
          socket.emit('search-query', query);

          // Once results are prepared by server, process them on client
          socket.on('feed-search-result', function (data) {
            if (data!=null) {
              console.log(`Data received - ${data.statuses.length}`);
              console.log('Start displaying tweets');
              for (var i = 0, len = data.statuses.length; i < len; i++) {
                // Hide loading animation
                $("body").removeClass("loading");
                // Extract tweet data
                var tweetText = data.statuses[i].text
                var tweetId = data.statuses[i].id_str;
                var authorName = data.statuses[i].user.name
                var userName = data.statuses[i].user.screen_name
                var profilePage = `http://twitter.com/${userName}`;
                var link = `http://twitter.com/anyuser/status/${tweetId}`;
                var profileImg = data.statuses[i].user.profile_image_url;
                var timeDateList = data.statuses[i].created_at;
                // Split received date for custom design
                timeDateList = timeDateList.split(' ');
                var weekDay = timeDateList[0];
                var month = timeDateList[1];
                var date = timeDateList[2];
                var time = timeDateList[3];
                var year = timeDateList[5];
                // Create div element that holds tweet data
                $tab.append(`<div id='id_${i}_search' class='search-tweet'><div><a class='search-tweet-author-page' href='${profilePage}'> <img class='search-tweet-author-img' alt='profile' src='${profileImg}' /> </a><a class='search-tweet-author-link' target="_blank" rel="noopener noreferrer" href='${profilePage}'> <span class='search-tweet-author'></span></a></div><div><span class='search-tweet-text'></span></div><div><span class='search-tweet-time'></span></div><div><span class='search-tweet-link'></span></div></div>`);
                var $div = $(`#id_${i}_search`);
                // Add tweet data to placeholders
                $div.find('.search-tweet-text').text(tweetText);
                $div.find('.search-tweet-author').text(authorName);
                $div.find('.search-tweet-time').text(`${weekDay}, ${date}.${month}.${year} ${time} GMT`);
                $div.find('.search-tweet-link').text(link);
                // Append 'tweet div' to 'parent div' element
                $tab.append($div).toggle().toggle();
              }
              console.log('All tweets has been displayed. Saving to DB...')
              if (dbHolder == null) {
                dbHolder = window.sqlitePlugin.openDatabase({name: "localStorage.db", location: 'default'});
              }
              for (var i = 0, len = data.statuses.length; i < len; i++) {
                // Extract tweet data
                var tweetText = data.statuses[i].text
                var tweetId = data.statuses[i].id_str;
                var authorName = data.statuses[i].user.name
                var userName = data.statuses[i].user.screen_name
                var profileImg = data.statuses[i].user.profile_image_url;
                var timeDateList = data.statuses[i].created_at;
                // Save tweet to DB
                if (app.preventDuplicatesDB(dbHolder, query,text, authorName, userName)===0) {
                  app.insertDataToDB(dbHolder, query, tweetText, tweetId, authorName, userName, profileImg, timeDateList);
                } else {
                  console.log('Duplicate has been detected');
                }

              }
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
      }
    },

    onStreamButtonClick: function(e) {
      e.preventDefault();
      if($(".stream-tweet").length) {
        $(".stream-tweet").remove();
      }
      var $tab = $('#search-stream-wrapper');
      var query = $('#stream-query').val();
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        alert('Type in your query');
        $('#stream-query').val("");
      } else {
        $("body").addClass("loading");
        console.log(`Query to Stream API ${query}`);
        if(io !== undefined) {
          // Storage for WebSocket connections
          var socket = io.connect(host);

          socket.emit('close-stream', ''); // Close previous stream, if the one exists
          socket.emit('stream-query', query); // Emit search query to Stream API

          // This listens on the "stream-result" channel and data is received everytime a new tweet is receieved.
          var counter = 0;
          socket.on('stream-result', function (data) {
            if (data!=null) {
              console.log('Data received');
              // Hide loading animation
              $("body").removeClass("loading");
              // Extract tweet data
              var tweetText = data.statuses[i].text
              var tweetId = data.statuses[i].id_str;
              var authorName = data.statuses[i].user.name
              var userName = data.statuses[i].user.screen_name
              var profilePage = `http://twitter.com/${userName}`;
              var link = `http://twitter.com/anyuser/status/${tweetId}`;
              var profileImg = data.statuses[i].user.profile_image_url;
              var timeDateList = data.statuses[i].created_at.split(' ');
              var weekDay = timeDateList[0];
              var month = timeDateList[1];
              var date = timeDateList[2];
              var time = timeDateList[3];
              var year = timeDateList[5];
              // Create div element that holds tweet data
              $tab.append(`<div id='id_${counter}_stream' class='stream-tweet'><div><a class='stream-tweet-author-page' href='${profilePage}'> <img class='stream-tweet-author-img' alt='profile' src='${profileImg}' /> </a><a class='stream-tweet-author-link' target="_blank" rel="noopener noreferrer" href='${profilePage}'> <span class='stream-tweet-author'></span></a></div><div><span class='stream-tweet-text'></span></div><div><span class='stream-tweet-time'></span></div><div><span class='stream-tweet-link'></span></div></div>`);
              var $div = $(`#id_${counter}_stream`);
              // Add tweet data to placeholders
              $div.find('.stream-tweet-text').text(tweetText);
              $div.find('.stream-tweet-author').text(authorName);
              $div.find('.stream-tweet-time').text(`${weekDay}, ${date}.${month}.${year} ${time} GMT`);
              $div.find('.stream-tweet-link').text(link);
              // Append 'tweet div' to 'parent div' element
              $tab.append($div).toggle().toggle();
              counter++;
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
      }
    },

    onDBButtonClick: function(e) {
      e.preventDefault();
      if($(".db-tweet").length) {
        $(".db-tweet").remove();
      }
      var $tab = $('#search-db-wrapper');
      var query = $('#db-query').val();
      if (query.length<=0 || query.replace(/ /g,'').length<=0) {
        alert('Type in your query');
        $('#db-query').val("");
      } else {
        $("body").addClass("loading");
        dbHolder.transaction(function (transaction) {
            transaction.executeSql('SELECT * FROM search_query WHERE query=?', [query],
              function (tx, results) {
                // access with results.rows.item(i).<field>
                console.log(`Data retrieved from DB - ${results.rows.length}`);
                // Hide loading animation
                $("body").removeClass("loading");
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
                    var timeDateList = results.rows.item(i).created_at.split(' ');
                    var weekDay = timeDateList[0];
                    var month = timeDateList[1];
                    var date = timeDateList[2];
                    var time = timeDateList[3];
                    var year = timeDateList[5];
                    // Create div element that holds tweet data
                    $tab.append(`<div id='id_${i}_db' class='db-tweet'><div><a class='db-tweet-author-page' href='${profilePage}'> <img class='db-tweet-author-img' alt='profile' src='${profileImg}' /> </a><a class='db-tweet-author-link' target="_blank" rel="noopener noreferrer" href='${profilePage}'> <span class='db-tweet-author'></span></a></div><div><span class='db-tweet-text'></span></div><div><span class='db-tweet-time'></span></div><div><span class='db-tweet-link'></span></div></div>`);
                    var $div = $(`#id_${i}_db`);
                    // Add tweet data to placeholders
                    $div.find('.db-tweet-text').text(tweetText);
                    $div.find('.db-tweet-author').text(authorName);
                    $div.find('.db-tweet-time').text(`${weekDay}, ${date}.${month}.${year} ${time} GMT`);
                    $div.find('.db-tweet-link').text(link);
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

    // DB initialisation and helpers
    initializeDB: function() {
      dbHolder = window.sqlitePlugin.openDatabase({name: "localStorage.db", location: 'default'});
      dbHolder.transaction(function (transaction) {
          transaction.executeSql('CREATE TABLE IF NOT EXISTS search_query (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, query TEXT, text TEXT, id_str TEXT, authorName TEXT, userName TEXT, profileImg TEXT, created_at TEXT)', [],
              function (tx, result) {
                  console.log("Table created successfully");
              },
              function (error) {
                  console.log(`Error occurred while creating the table - ${error}`);
              });
      });
    },

    insertDataToDB: function(holder, query, text, id_str, authorName, userName, profileImg, created_at) {
      holder.transaction(function(tx) {
        tx.executeSql('INSERT INTO search_query (query, text, id_str, authorName, userName, profileImg, created_at) VALUES (?,?,?,?,?,?,?)', [query, text, id_str, authorName, userName, profileImg, created_at]);
      }, function(error) {
        console.log('Transaction ERROR: ' + error.message);
      }, function() {
        console.log('Populated database OK');
      });
    },

    preventDuplicatesDB: function(holder, query, text, authorName, userName) {
      holder.transaction(function(tx) {
        tx.executeSql('SELECT * FROM search_query where query=? AND text=? AND authorName=? AND userName=?', [query, text, authorName, userName]);
      }, function(error) {
        console.log('Transaction ERROR: ' + error.message);
      }, function(tx, results) {
        console.log(`Collisions found - ${results.rows.length}`);
        return results.rows.length
      });
    },

    deleteDataFromDB: function() {
    },

    // Stop tweets stream function
    stopStream: function() {
      console.log('Stop stream is called')
      if(io !== undefined) {
          // Storage for WebSocket connections
          var socket = io.connect(host);
          socket.emit('close-stream', ''); // Close stream once it's not needed
        }
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
      $('.tab-button').on('click', this.onTabClick);
      $("#btn-search-query").on( "click", this.onSearchButtonClick);
      $("#btn-stream-query").on( "click", this.onStreamButtonClick);
      $("#btn-search-db-query").on( "click", this.onDBButtonClick);
      //$("#btn-stop-stream").on( "click", this.stopStream);
      console.log('Received Event: ' + id);
    },

    // Custom alerts
    overrideBrowserAlert: function() {
      if (navigator.notification) { // Override default HTML alert with native dialog
        window.alert = function (msg) {
          navigator.notification.alert(
            msg,    // message
            null,       // callback
            "Northern Light", // title
            'Continue'        // buttonName
            );
        };
      }
    },
};

app.initialize();
