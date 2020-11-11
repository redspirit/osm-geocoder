
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss' });
const express = require('express');
const bodyParser = require('body-parser');
const config = require('confservice');
const app = express();


app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public', {
    index: 'index.html'
}));


app.use((req, res, next) => {
    res.sendStatus(404);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.sendStatus(500);
});

app.listen(config.port, () => {
    console.log('Geocoder listening on port', config.port);
});
