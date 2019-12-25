'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const fs = require('fs');
const { db } = require('./config');
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
app.post('/webhook/', async (req, res) => {
    var messaging_events = req.body.entry[0].messaging;
    for (var i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;
        if (event.message && event.message.text) {
            var text = event.message.text;
            const name = text.toLowerCase();
            const data_check = await fetchSessionSender(sender);
            if(data_check.step == undefined) {
                const has_store_available = await hasAvailable(name);
                if(has_store_available) {
                    await insertOne("sessions",{ sender: sender, store_name: name, step: 1 });
                    sendTextMessage(sender, "Please enter your order number: ");
                } else {
                    sendTextMessage(sender, "Sorry, your store has not registed. Please try again!");
                }
            } else {
                if(data_check.step == 1) {
                    // sendTextMessage(sender, text);
                    handleCreateShipback(sender, text);
                } else {
                    sendTextMessage(sender, "Please enter your store name: ");
                }
            }
        }
    }
    res.sendStatus(200);
});
app.post('/shipbacks', async (req, res) => {
    const { name, sender } = req.body || {};
    const data_check = await fetchSessionSender(sender);
    console.log(data_check);
    res.json('test');
});
const hasAvailable = async (store) => {
    const data = await fetchByField("stores", { name: store.trim() });
    return data.length !== 0;
};
const fetchSessionSender = async (sender) => {
    const data = await fetchByField("sessions", {sender});
    return data;
};
const fetchById = (table, id) => {
    const sql = `Select * From ${table} Where id=?`;
    return new Promise(resolve => {
        db.get(sql, [id], (err, data) => {
            if (err) resolve(err);
            if (data == undefined) resolve([]);
            resolve(data);
        });
    });
}
const fetchByField = (table, object = {}, terminate = 'AND') => {
    const { condition, values } = toCondition(object, terminate);
    const sql = `Select * From ${table} Where ${condition}`;
    return new Promise(resolve => {
        db.get(sql, values, (err, data) => {
            if (err) resolve(err);
            if (data == undefined) resolve({ error: true });
            resolve(data);
        });
    });
}
const fetchAll = (table) => {
    const sql = `Select * From ${table}`;
    return new Promise(resolve => {
        db.get(sql, [], (err, data) => {
            if (err) resolve(err);
            if (data == undefined) resolve([]);
            resolve(data);
        });
    });
}
const insertAll = async (table, array_object = []) => {
    let count = 0;
    for (let object of array_object) {
        await insertOne(table, object);
        count++;
        if(count == (array_object.length - 1)) return await insertOne(table, object);
    }
};

const insertOne = (table, object = {}) => {
    object.id = Math.ceil(Date.now() + Math.random());
    const keys = fetchKeys(object);
    const { values_string , values } = fetchValues(object);
    const sql = `INSERT INTO ${table}(${keys}) Values ${values_string}`;
    return new Promise(resolve => {
        db.run(sql, values, function(err) {
            if (err) resolve({ success: false, message: err });
            resolve({ success: true, message: "success" });
        });
    });
};

const fetchValues = (object) => {
    let values = [];
    let values_question = [];
    let values_string = '';
    for( let key in object) {
        values.push(object[key]);
        values_question.push('?');
    }
    values_string = '(' + values_question.join(',') + ')';
    return { values_string , values };
};
const fetchKeys = (object) => {
    const keys = [];
    for( let key in object) {
        keys.push(key);
    }
    return keys.join(',');
};

const update = (table, conditions = {}) => {
    const { condition, values } = toCondition(conditions);
    let sql = `UPDATE ${table}
            SET ${condition}
            WHERE ${condition}`;
    return new Promise(resolve => {
        db.run(sql, values, function (err) {
            if (err) {
                resolve({ success: false });
            }
            resolve({ success: true });
        });
    });
}
const toCondition = (object, terminate = ",") => {
    let condition = '';
    let values = [];
    let i = 0;
    for (let key in object) {
        condition = i == 0? `${condition} ${key}=?` : `${condition} ${terminate} ${key}=?`;
        values.push(object[key]);
        i++;
    }
    return { condition, values };
};
const handleCreateShipback = async (sender, text) => {
    try {
        const { shipback } = await createShipback(text);
        if (shipback.error) {
            sendTextMessage(sender, 'Sorry, Your order number is not registed');
        } else {
            sendTemplate(sender, shipback.public_url);
        }
    } catch (error) {
        sendTextMessage(error);
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
        message: {
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
    const headers = (token != null) ? {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${token}`
    } : { 'Content-Type': 'application/json' };
    return headers;
}

const httpPost = (short_url = '', payload, type = 'srb') => {
    const headers = { 'srb': httpHeaderSRB(auth_token), 'fb': httpHeaderFB(token) };
    const url = { 'srb': `${dashboard_url}/${short_url}`, 'fb': `${fb_url}/${short_url}` };
    return httpRequest(url[type], 'POST', payload, headers[type]);
}

const httpRequest = (url, method, json = {}, headers = {}) => {
    return new Promise((resolve, reject) => {
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