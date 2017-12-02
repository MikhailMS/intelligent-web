# Intelligent web
## COM3504 Assignment - Twitter Search Application

### Application is build upon Twitter Search & Streaming API, to allow you to search for various tweets published on twitter.com in real-time. Application is more focused on football players and clubs, so it would provide extra information about players and clubs, but not, apparently, limited by that.

### List of functions to be added later:
- [x] Querying Twitter Search & Streaming APIs'
    - [x] Players, e.g. using their names, Twitter screen names or a range of selected keywords or hashtags
    - [x] Football teams using their names
    - [x] Authors of tweets
- [x] Output fetched tweets in user-friendly manner
    - [x] Return a list of 300 tweets ( or less, if there are no 300 tweets)
    - [x] For each tweet provide following:
      1. Author, text, time and date
      2. the link to the original message and
      3. a link to the author’s page
- [ ] Plot frequency graphs: how often searched player or club appears in tweets over specific time frame
- [x] Store data in database
    - [x] Database should be used as source of data
    - [x] Database should be used as a cache to reduce number of queries sent to Twitter API
- [x] Build a mobile application with Apache Cordova
- [x] Integrate information retrieved from DBPedia (data about clubs and/or players)

### Project has been tested manually, mobile app was tested on Nexus 5 - Android 7.1.2.
