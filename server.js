'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

// app.set('port', (process.env.PORT || 8000));
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Proxy version 1.0'));
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.FB_TOKEN) {
		res.send(req.query['hub.challenge']);
	}
	res.send('Wrong token!');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))