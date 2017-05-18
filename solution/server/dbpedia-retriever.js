/**
 * Created by blagoslav on 18.05.17.
 */

var sparql = require('sparql');

getQuery = function(name) {
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
        "?player dbo:birthPlace ?birthPlace ."+
        "?birthPlace rdfs:label ?place_name ."+
        "?player dbp:currentclub ?currentclub ."+
        "?currentclub rdfs:label ?club_name ."+
        "?player dbo:number ?number ."+
        "?player foaf:depiction ?depiction ."+
        "?player dbo:thumbnail ?thumbnail ."+
        "?player a dbo:SoccerPlayer ."+
        "?player dbo:birthDate ?birthDate ."+
        "?player dbo:position ?position ."+
        "?position rdfs:label ?pos_label ."+
        "FILTER (?label = '"+name+"'@en) ."+
        "FILTER (lang(?pos_label) = 'en') ."+
        "FILTER (lang(?club_name) = 'en') ."+
        "FILTER (lang(?place_name) = 'en') ."+
        "FILTER (lang(?abstract) = 'en') ."+
    "} LIMIT 1";

};

getPlayerData = function(name, callback) {
    var client = new sparql.Client('http://dbpedia.org/sparql');
    client.query(getQuery(name), function(err, res) {
       var p = res.results.bindings[0];
       var player = {
           fullname: p.fullname.value,
           abstract: p.abstract.value,
           height: p.height.value,
           birthplace: p.place_name.value,
           current_club: p.club_name.value,
           thumbnail_url: p.thumbnail.value,
           depiction_url: p.depiction.value,
           birth_date: p.birthDate.value,
           position: p.pos_label.value
       };
       callback(player);
    });
};

module.exports = { getPlayerData };