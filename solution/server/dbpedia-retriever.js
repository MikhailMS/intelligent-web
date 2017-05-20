/**
 * Created by blagoslav on 18.05.17.
 */
const   SPARQL = require('sparql'),
        LOG = require('./logger'),
        LNAME = 'DBPEDIA';

let client = new SPARQL.Client('http://dbpedia.org/sparql');

const dbpedia_error = {
    title: 'DBPedia error',
    msg: 'There was error while attempting to query' +
    'DBPedia using the SPARQL endpoint.'
};

const dbpedia_empty_error = {
    title: 'DBPedia error',
    msg: 'Results of SPARQL query were empty.'
};

function getQuery(name) {
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
        //"?player dbo:birthPlace ?birthPlace ."+
        //"?birthPlace rdfs:label ?place_name ."+
        "?player dbp:currentclub ?currentclub ."+
        "?currentclub rdfs:label ?club_name ."+
        //"?player dbo:number ?number ."+
        "?player foaf:depiction ?depiction ."+
        "?player dbo:thumbnail ?thumbnail ."+
        "?player a dbo:SoccerPlayer ."+
        "?player dbo:birthDate ?birthDate ."+
        "?player dbo:position ?position ."+
        "?position rdfs:label ?pos_label ."+
        "FILTER (?label = '"+name+"'@en) ."+
        "FILTER (lang(?pos_label) = 'en') ."+
        "FILTER (lang(?club_name) = 'en') ."+
        //"FILTER (lang(?place_name) = 'en') ."+
        "FILTER (lang(?abstract) = 'en') ."+
    "} LIMIT 1";
}

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

getPlayerData = function(name, callback) {
    LOG.log(LNAME, 'Querying DBPedia for '+name+'.');
    client.query(getQuery(name), (err, res) => {
        if(err === null) {
            if (res === undefined) {
                LOG.log(LNAME, 'Error retrieving data from DBPedia.');
            } else {
                let p = res.results.bindings[0];
                if(p !== undefined && p !== null) {
                    callback(null, convertToPlayer(p));
                } else {
                    callback(dbpedia_empty_error, null);
                    LOG.log(LNAME, 'DBPedia returned empty data');
                }
            }
        } else {
            LOG.log(LNAME, 'DBPedia returned an error.');
            console.log(err);
            callback(dbpedia_error, null);
        }
    });
};

module.exports = { getPlayerData };