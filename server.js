'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const fs = require('fs');
require('dotenv').config();

const port = process.env.PORT || 3000;
const dashboard_url = process.env.DASHBOARD_URL;
const auth_token = process.env.AUTH_TOKEN;
const token = process.env.FB_TOKEN || "";
const fb_url = process.env.FB_URL;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/', (req, res) => res.send('Proxy version 1.0'));
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === token) {
		res.send(req.query['hub.challenge']);
	}
	res.send('Wrong token!');
});
app.post('/webhook/', function(req, res) {
    var messaging_events = req.body.entry[0].messaging;
    for (var i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;
        let rawdata = fs.readFileSync('fb.json');
        let db = JSON.parse(rawdata);
        if (event.message && event.message.text) {
            var text = event.message.text;
            // sendTextMessage(sender, db.store_name);
            if (db.store_name == 0) {
                if (hasAvailable(text)){
                    db.store_name = text;
                    const json = JSON.stringify(db);
                    fs.writeFile('fb.json', json, 'utf8', callback);
                    sendTextMessage(sender, "Please enter your order number: ");
                } else {
                    sendTextMessage(sender, "Sorry, your store are not registed. Please try again!");
                }
            } else {
                handleCreateShipback(sender, text);
            }
        }
    }
    res.sendStatus(200);
});
app.post('/shipbacks', async (req, res) => {
    const { order_id } = req.body;
    const data = await createShipback(order_id)
    res.json(data);
});
const hasAvailable = (store) => {
    return store == 'etam';
};
const handleCreateShipback = async (sender, text) => {
    const { shipback } = await createShipback(text);
    if(shipback.error) {
        sendTextMessage(sender, 'Sorry, Your order number is not registed');
    } else {
        sendTemplate(sender, shipback.public_url);
    }
};

function sendTextMessage(sender, text) {
    var payload = {
        message: {
            text: text
        },
        recipient: {
            id: sender
        },
    };
    httpPost('', payload, 'fb');
}

function sendTemplate(sender, web_url) {
    const payload = {
        recipient: {
            id: sender
        },
        message:  {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Click button below to return shipback",
                    buttons: [{
                        type: "web_url",
                        url: web_url,
                        title: "Return shipback",
                        webview_height_ratio: "full",
                        messenger_extensions: false
                    }]
                }
            }
        }
    };
    httpPost('', payload, 'fb');
}

const createShipback = async (order_id) => {
    const payload = { order_id };
    return await httpPost('shipbacks', payload);
}

const httpHeaderFB = (token = null) => {
    return { access_token: token };
}

const httpHeaderSRB = (token = null) => {
    const headers = (token != null) ?{
        'Content-Type': 'application/json',
        'Authorization': `Token token=${token}`
    } : { 'Content-Type': 'application/json' };
    return headers;
}

const httpPost = (short_url = '', payload, type = 'srb') => {
    const headers = { 'srb': httpHeaderSRB(auth_token), 'fb': httpHeaderFB(token) };
    const url = {  'srb': `${dashboard_url}/${short_url}`, 'fb': `${fb_url}/${short_url}` };
    return httpRequest(url[type], 'POST', payload, headers[type]);
}

const httpRequest = (url, method, json = {}, headers = {}) => {
    return new Promise((resolve, reject) => 
    { 
        request({
            url: `${url}`,
            method,
            headers: headers,
            qs: headers,
            json
        }, (error, response, body) => {
            resolve(body);   
        });
    });
};
app.listen(port, () => console.log(`Chatbot Return listening on port ${port}!`))