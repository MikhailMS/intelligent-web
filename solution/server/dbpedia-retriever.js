/**
 * dbpedia-retriever.js
 *
 * This file is used to retrieve
 * data about football players from
 * DBPedia by using SPARQL queries.
 *
 * Written by:  Blagoslav Mihaylov,
 * Last updated: 18/05/2017
 */

//load dependencies
const   SPARQL = require('sparql'),
        LOG = require('./logger'),
        LNAME = 'DBPEDIA';

//initialize SPARQL client
let client = new SPARQL.Client('http://dbpedia.org/sparql');

//init errors
const dbpedia_error = {
    title: 'DBPedia error',
    msg: 'There was error while attempting to query' +
    'DBPedia using the SPARQL endpoint.'
};

const dbpedia_empty_error = {
    title: 'DBPedia error',
    msg: 'Results of SPARQL query were empty.'
};

/**
 * Generates a SPARQL query for
 * the specified footballer.
 *
 * @param name - name of football player
 * @returns {string} - the SPARQL query
 */
function getQuery(name) {
    //query is obviously not escaped, but what's the
    //worst that could happen? all input is supplied
    //server-side, so we're safe
    return  ""+
    "PREFIX dbo:<http://dbpedia.org/ontology/>"+
    "PREFIX person:<http://dbpedia.org/ontology/Person/>" +
    "PREFIX dbp:<http://dbpedia.org/property/>" +
    "PREFIX foaf:<http://xmlns.com/foaf/0.1/>" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
    ""+
    "SELECT * WHERE { " +
        "?player dbo:abstract ?abstract ."+
        "?player a dbo:Person ."+
        "?player rdfs:label ?label ."+
        "?player person:height ?height ."+
        "?player dbp:fullname ?fullname ."+
        "?player dbp:currentclub ?currentclub ."+
        "?currentclub rdfs:label ?club_name ."+
        "?player foaf:depiction ?depiction ."+
        "?player dbo:thumbnail ?thumbnail ."+
        "?player a dbo:SoccerPlayer ."+
        "?player dbo:birthDate ?birthDate ."+
        "?player dbo:position ?position ."+
        "?position rdfs:label ?pos_label ."+
        "FILTER (?label = '"+name+"'@en) ."+
        "FILTER (lang(?pos_label) = 'en') ."+
        "FILTER (lang(?club_name) = 'en') ."+
        "FILTER (lang(?abstract) = 'en') ."+
    "} LIMIT 1";
}

/**
 * Converts the results from DBPedia to a
 * player object.
 *
 * @param playerResult - results from DBPedia
 * @returns player object
 */
function convertToPlayer(playerResult) {
    return {
        fullname: playerResult.fullname.value,
        abstract: playerResult.abstract.value,
        height: playerResult.height.value,
        current_club: playerResult.club_name.value,
        thumbnail_url: playerResult.thumbnail.value,
        depiction_url: playerResult.depiction.value,
        birth_date: playerResult.birthDate.value,
        position: playerResult.pos_label.value
    };
}

/**
 * Exported function used to return data
 * from DBPedia for a specified football
 * player.
 *
 * @param name - name of the DBPedia entry for the player
 * @param callback - receives back the player data
 */
getPlayerData = function(name, callback) {
    LOG.log(LNAME, 'Querying DBPedia for '+name+'.');

    //send query
    client.query(getQuery(name), (err, res) => {
        if(err === null) { //if no error
            if (res === undefined) { //if no results
                LOG.log(LNAME, 'Error retrieving data from DBPedia.');
            } else {
                //process results
                let p = res.results.bindings[0];
                if(p !== undefined && p !== null) {
                    callback(null, convertToPlayer(p));
                } else { //if empty results
                    callback(dbpedia_empty_error, null);
                    LOG.log(LNAME, 'DBPedia returned empty data.');
                }
            }
        } else { //if error
            LOG.log(LNAME, 'DBPedia returned an error.');
            console.log(err);
            callback(dbpedia_error, null);
        }
    });
};

//export functions
module.exports = { getPlayerData };