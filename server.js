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
            const message = text.toLowerCase();
            if(message.length <= 0) return;
            const {step, order_id } = await fetchSessionSender(sender) || {};
            if(order_id !== undefined && order_id !== null) {
                if(step == 1) {
                    await sendTextMessage(sender, `You have an order(${order_id}) selected already!. Do you want to return new? [yes] = return new or [no] = current shipback `);
                    await saveOrderIdBySender(sender, { order_id: null, step: 2 });
                    return;
                }
                if(message == 'yes'){
                    await saveOrderIdBySender(sender, { order_id: null, step: 1 });
                    return await sendTextMessage(sender, "Please enter your order number: ");
                } else if(message == 'no') {
                    await saveOrderIdBySender(sender, { step: 1 });
                    return await sendMessagebyOrder(sender, order_id);
                }   
            }
            if(step == undefined) {
                const has_store_available = await hasAvailable(name);
                if(has_store_available) {
                    await insertOne("sessions",{ sender: sender, store_name: name, step: 1 });
                    await sendTextMessage(sender, "Please enter your order number: ");
                } else {
                    await sendTextMessage(sender, "Sorry, your store has not registed. Please try again!");
                }
            } else {
                if(step == 1) {
                    await sendMessagebyOrder(sender, text);
                }else {
                    sendTextMessage(sender, "test");
                }
            }
        }
    }
    res.sendStatus(200);
});
app.post('/shipbacks', async (req, res) => {
    const data = await update('sessions', { order_id: 124212}, { sender: 122 });
    res.json(data);
});
app.get('/orders/:id', async (req, res) => {
    const { id } = req.params || {};
    const shipback_id = await fetchShipbackByOrder(id);
    res.json(shipback_id);
});
const hasAvailable = async (store) => {
    const {error} = await fetchByField("stores", { name: store }) || {};
    return error ? false: true;
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

const sendMessagebyOrder = async (sender, order_id) => {
    const { shipback_id, is_order } = await hasAvailableOrder(order_id);
    if (shipback_id !== null) {
        const { public_url, charged, label_url } = await httpGet(`shipbacks/${shipback_id}`) || {};
        await saveOrderIdBySender(sender, { order_id, step: 1 });
        if(charged) {
            await sendMessageButton(sender, 'Tracking', 'Click to tracking your shipback', public_url);
            return await sendMessageButton(sender, 'Download Label', 'Your shipback already return!. Please download label below', label_url);
        }
        return await sendTemplate(sender, public_url);
        
    }
    if (shipback_id == null && is_order == true) {
        const { shipback } = await createShipback(order_id);
        await saveOrderIdBySender(sender, { order_id, step: 1 });
        await sendTemplate(sender, shipback.public_url);
        return;
    }
    await sendTextMessage(sender, "Sorry, your order has not registered. Please enter again");
};
const saveOrderIdBySender = async (sender, object = {}) => {
    const { success } = await update('sessions', object, { sender });
    return success;
};
const hasAvailableOrder = async (order_id) => {
    const order_url = `orders/${order_id}`;
    const { shipback_id, id } = await httpGet(order_url) || {};
    if(shipback_id !== undefined)  return { shipback_id };
    if(id !== undefined && shipback_id == undefined) return { shipback_id: null, is_order: true };
    return { shipback_id: null, is_order: false };
};
const update = (table, object = {}, conditions = {}) => {
    const { condition, values } = toCondition(object);
    const con = toCondition(conditions, 'AND');
    const arr = values.concat(con.values);
    let sql = `UPDATE ${table}
            SET ${condition}
            WHERE ${con.condition}`;
    return new Promise(resolve => {
        db.run(sql, arr, function (err) {
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
const sendTextMessage = async (sender, text) => {
    var payload = {
        message: {
            text: text
        },
        recipient: {
            id: sender
        },
    };
    await httpPost('', payload, 'fb');
    return { success: true };
}

const sendTemplate = async (sender, web_url) => {
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
    await httpPost('', payload, 'fb');
    return { success: true };
}

const sendMessageButton = async (sender, title, message, web_url) => {
    const payload = {"recipient":{
        "id": sender
      },
      "message":{
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text": message,
            "buttons":[
              {
                "type":"web_url",
                "url": web_url,
                "title": title
              }
            ]
          }
        }
    }};
    await httpPost('', payload, 'fb');
    return { success: true };
};

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

const httpPost = async (short_url = '', payload, type = 'srb') => {
    const headers = { 'srb': httpHeaderSRB(auth_token), 'fb': httpHeaderFB(token) };
    const url = { 'srb': `${dashboard_url}/${short_url}`, 'fb': `${fb_url}/${short_url}` };
    return await httpRequest(url[type], 'POST', payload, headers[type]);
}
const httpGet = async (short_url = '', type = 'srb') => {
    const headers = { 'srb': httpHeaderSRB(auth_token), 'fb': httpHeaderFB(token) };
    const url = { 'srb': `${dashboard_url}/${short_url}`, 'fb': `${fb_url}/${short_url}` };
    return await httpRequest(url[type],'GET',{}, headers[type]);
};

const httpRequest = (url, method, json = {}, headers = {}) => {
    return new Promise((resolve, reject) => {
        request({
            url: `${url}`,
            method,
            headers: headers,
            qs: headers,
            json
        }, (error, response, body) => {
            if(error) resolve(error);
            resolve(body);
        });
    });
};
app.listen(port, () => console.log(`Chatbot Return listening on port ${port}!`))