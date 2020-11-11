
// const utils = require("../modules/utils.js");
// const Files = require("../modules/files");

const _ = require("underscore");
const numeral = require('numeral');
const osm = require('openstreetmap-stream');
const through = require('through2');

const mongo = require('../modules/mongo');
let nodesCollection = null;
let waysCollection = null;
let relationsCollection = null;

mongo.onConnected = function (db) {
    nodesCollection = db.collection('nodes');
    waysCollection = db.collection('ways');
    relationsCollection = db.collection('relations');
    start();
};

const Stat = function (pref, step) {
    let nodes = 0;
    let ways = 0;
    let relations = 0;

    let isSHow = (n) => {
        return n % step === 0;
    }

    this.tickNode = () => {
        nodes++;
        isSHow(nodes) && console.log(pref, 'Nodes...', numeral(nodes).format('0.0a'));
    }
    this.tickWay = () => {
        ways++;
        isSHow(ways) && console.log(pref, 'Ways...', numeral(ways).format('0.0a'));
    }
    this.tickRelation = () => {
        relations++;
        isSHow(relations) && console.log(pref, 'Relations...', numeral(relations).format('0.0a'));
    }
    this.tickFinish = () => {
        console.log(pref, "Total nodes:", nodes);
        console.log(pref, "Total ways:", ways);
        console.log(pref, "Total relations:", relations);
    }

}

let stat = new Stat('Read',500000);

let start = () => {

    let oldType = '';

    osm
        // .createReadStream( __dirname + '/../data/kaliningrad-latest.osm.pbf' )
        // .createReadStream( __dirname + '/../data/central-fed-district-latest.osm.pbf' )
        .createReadStream('D:/mongoDB/OSM/central-fed-district-latest.osm.pbf')
        .pipe( through.obj(( data, enc, next ) => {

            if(oldType !== data.type) {

                if(oldType === 'node') {
                    onNodeFinish();
                }

                if(oldType === 'way') {
                    onWayFinish();
                }

                oldType = data.type;
            }

            if(data.type === 'node') {
                onNode(data, next);
            } else if (data.type === 'way') {
                onWay(data, next)
            } else if (data.type === 'relation') {
                onRelation(data, next);
            }

        }))
        .on('finish', function () {
            onRelationFinish();
        });

};

let count = 0;
let limitCount = 0;
let insertedArr1 = [];
let insertedArr2 = [];
let insertedArr3 = [];

let subways = [];

let onNode = (node, next) => {
    stat.tickNode();

    limitCount++;
    count++;
    insertedArr1.push({
        id: +node.id,
        lat: node.lat,
        lng: node.lon,
        tags: node.tags
        // h: node.tags['addr:housenumber'],
        // s: node.tags['addr:street'],
        // n: node.tags['name'],
    });

    if(count === 300) {
        count = 0;
        nodesCollection.insertMany(insertedArr1, (err, result) => {
            insertedArr1 = [];
            next();
        });
    } else {
        return next();
    }

}

let onNodeFinish = () => {
    console.log('Node finish');
    nodesCollection.insertMany(insertedArr1, (err, result) => {
        insertedArr1 = [];
    });
}

let onWay = (way, next) => {

    stat.tickWay();

    count++;
    insertedArr2.push({
        id: +way.id,
        refs: way.refs.map(item => +item),
        tags: way.tags,
        // h: way.tags['addr:housenumber'],
        // s: way.tags['addr:street'],
        // name: way.tags['name'],
        // land: way.tags['landuse'],
        // place: way.tags['place'],
    });

    if(count === 300) {
        count = 0;
        waysCollection.insertMany(insertedArr2, (err, result) => {
            insertedArr2 = [];
            next();
        });
    } else {
        return next();
    }

}

let onWayFinish = () => {
    console.log('way finish');
    waysCollection.insertMany(insertedArr2, (err, result) => {
        insertedArr2 = [];
    });
}

let onRelation = (relation, next) => {
    stat.tickRelation();
    count++;
    insertedArr3.push({
        id: +relation.id,
        members: relation.members,
        tags: relation.tags
        // b: relation.tags['boundary'],
        // level: relation.tags['admin_level'],
        // place: relation.tags['place'],
        // name: relation.tags['name'],
        // iso: relation.tags['ISO3166-2'],
        // h: relation.tags['addr:housenumber'],
        // s: relation.tags['addr:street'],
    });

    if(count === 300) {
        count = 0;
        relationsCollection.insertMany(insertedArr3, (err, result) => {
            insertedArr3 = [];
            next();
        });
    } else {
        return next();
    }

}

let onRelationFinish = () => {

    relationsCollection.insertMany(insertedArr3, (err, result) => {
        insertedArr3 = [];
    });

    stat.tickFinish();

}

module.exports.start = start;




