
let config = require('confservice').mongo;
const MongoClient = require('mongodb').MongoClient;

const url = `mongodb://${config.user}:${config.password}@${config.server}/${config.database}`;

let connectWithRetry = function() {
    return MongoClient.connect(url, (err, client) => {

        if(err) {
            console.error('Failed to connect to mongo on startup - retrying in 5 sec');
            return setTimeout(connectWithRetry, 5000);
        }

        const db = client.db(config.database);

        console.log("Connect to MongoDB - OK!");

        module.exports.db = db;
        module.exports.onConnected && module.exports.onConnected(db);

    });
};

connectWithRetry();
