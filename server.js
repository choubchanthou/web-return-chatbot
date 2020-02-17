'use strict';

const express = require('express');
const bodyParser = require('body-parser');
// const request = require('request');
const app = express();
// const { db } = require('./config');
require('dotenv').config();

const port = process.env.PORT || 3000;
// const dashboard_url = process.env.DASHBOARD_URL;
// const auth_token = process.env.AUTH_TOKEN;
// const token = process.env.FB_TOKEN || "";
// const fb_url = process.env.FB_URL;
const { store } = require('./helpers/query');
const webhooks = require('./routes/webhooks');
const shipbacks = require('./routes/shipbacks');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/', (req, res) => res.send('Proxy version 1.0'));
app.use('/webhook', webhooks);
app.use('/', shipbacks);
app.listen(port, () => console.log(`Chatbot Return listening on port ${port}!`))