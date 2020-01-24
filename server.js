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
            const { step } = await fetchSessionSender(sender) || {};
            if (message == 'hi') {
                await deleteSender(sender);
                break;
            }
            if (step == undefined || step == 0) {
                const has_store_available = await hasAvailable(name);
                if (has_store_available) {
                    await insertOne("sessions", { sender: sender, store_name: name, step: 1 });
                    await sendTextMessage(sender, "Please enter your order number: ");
                    break;
                } 
                await sendTextMessage(sender, "Sorry, your store has not registed. Please try again!");
                break;
            } else {
                if (await hasSelectedOrder(sender, message)) break;
                await sendMessagebyOrder(sender, text);
                break;
            }
        } else if (event.postback) {
            await handlePostBack(sender, event.postback);
            break;
        } else if (event.referral) {
            await handleMessagingRef(sender, event.referral);
            break;
        }
    }
    res.sendStatus(200);
});
app.post('/shipbacks/finish', async (req, res) => {
    const { order_number, label_url } = req.body || {};
    const { sender } = await fetchByField("sessions", { order_id: order_number });
    await addOrder(sender, null, 'etam');
    await sendMessageButton(sender, 'Download label', "Your order are registered!. Please download label below", label_url, "false");
    res.json({ success: true });
});
app.get('/orders/:id', async (req, res) => {
    const { id } = req.params || {};
    const dt_res = await deleteById('sessions', id);
    res.json(dt_res);
});
const handlePostBack = async (sender, postback) => {
    try {
        const { referral } = postback || {};
        const { ref } = referral || {};
        const { store, order_id } = separateRef(ref) || { store: null, order_id: null };
        if (await hasNotRef(sender, store, order_id) != false) return true;
        if (await hasStoreRef(sender, store, order_id) != false) return true;
        return await hasAllRef(sender, store, order_id);
    } catch (error) {
        return await sendTextMessage(sender, error.toString());
    }
};
const handleMessagingRef = async (sender, referral) => {
    const { ref } = referral || {};
    const { store, order_id } = separateRef(ref) || { store: null, order_id: null };
    if (await hasNotRef(sender, store, order_id) != false) return true;
    if (await hasStoreRef(sender, store, order_id) != false) return true;
    return await hasAllRef(sender, store, order_id);
}
const hasNotRef = async (sender, store, order_id) => {
    if (store == null && order_id == null) {
        return await sendTextMessage(sender, "Please enter your store name:");
    }
    return false;
}
const hasStoreRef = async (sender, store, order_id) => {
    if (store !== null && order_id == null) {
        const is_avail = await hasAvailable(store);
        const { store_name } = await fetchSessionSender(sender) || {};
        if (!is_avail) return await sendTextMessage(sender, `Sorry, your store(${store}) has not registed. Please try again!`);
        if (store_name == undefined) {
            await insertOne("sessions", { sender, store_name: store, step: 1 });
        } else {
            await saveOrderIdBySender(sender, { store_name: store, step: 1 });
        }
        return await sendTextMessage(sender, "Please enter your order number: ");
    }
    return false;
};
const hasAllRef = async (sender, store, _order_id) => {
    try {
        if (store !== null && _order_id !== null) {
            const is_avail = await hasAvailable(store);
            if (!is_avail) return await sendTextMessage(sender, `Sorry, your store(${store}) has not registed. Please try again!`);
            if (await hasSelectedOrder(sender, _order_id, _order_id)) return true;
            await addOrder(sender, _order_id, store);
            return await sendMessagebyOrder(sender, _order_id);
        }
        return false;
    } catch (error) {
        sendTextMessage(sender, error.toString())
        return false;
    }
};
const addOrder = async (sender, order, store_name) => {
    const { shipback_id } = await hasAvailableOrder(order) || {};
    if (shipback_id == null) return;
    let { charged } = await httpGet(`shipbacks/${shipback_id}`) || {};
    const { order_id } = await fetchByField('sessions', { sender }) || {};
    if(charged && order_id == undefined) insertOne('sessions', { sender, store_name, step: 1 });
    if (charged == false && order_id == undefined) return await insertOne('sessions', { sender, order_id: order, store_name, step: 1 });
    return await saveOrderIdBySender(sender, {order_id: order_id, store_name, step: 1});
};
const separateRef = (ref) => {
    ref = ref || '';
    const ref_array = ref == '' ? [] : ref.split(',');
    const count = ref_array.length;
    if (count <= 1) return { store: ref_array[0], order_id: null };
    if (count == 0) return { store: null, order_id: null };
    return { store: ref_array[0], order_id: ref_array[1] };
};
const hasSelectedOrder = async (sender, message) => {
    const { order_id } = await fetchByField('sessions', { sender }) || {};
    if (order_id == undefined || order_id == null) return false;
    if (message == 'new') {
        await saveOrderIdBySender(sender, { order_id: null, step: 1 });
        await sendTextMessage(sender, "Please enter your order number: ");
        return true;
    }
    await sendTextMessage(sender, `You have an order(${order_id}) selected already!. Please say [new] to new return`);
    await sendMessagebyOrder(sender, order_id);
    return true;
};
const hasAvailable = async (store) => {
    const { error } = await fetchByField("stores", { name: store }) || {};
    return error ? false : true;
};
const deleteSender = async (_sender) => {
    const { sender } = await fetchSessionSender(_sender) || {};
    if (sender == undefined) return { success: true, message: "success" };
    await deleteById('sessions', { sender });
    await sendTextMessage(sender, 'Please enter your store name:');
    return true;
};
const fetchSessionSender = async (sender) => {
    const data = await fetchByField("sessions", { sender });
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
const deleteById = (table, object = {}, terminate = 'AND') => {
    const { condition, values } = toCondition(object, terminate);
    const sql = `DELETE FROM ${table} WHERE ${condition}`;
    return new Promise(resolve => {
        db.run(sql, values, function (err) {
            if (err) resolve({ success: false, message: err });
            resolve({ success: true, message: "success" });
        });
    });
};
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
        if (count == (array_object.length - 1)) return await insertOne(table, object);
    }
};

const insertOne = (table, object = {}) => {
    object.id = Math.ceil(Date.now() + Math.random());
    const keys = fetchKeys(object);
    const { values_string, values } = fetchValues(object);
    const sql = `INSERT INTO ${table}(${keys}) Values ${values_string}`;
    return new Promise(resolve => {
        db.run(sql, values, function (err) {
            if (err) resolve({ success: false, message: err });
            resolve({ success: true, message: "success" });
        });
    });
};

const fetchValues = (object) => {
    let values = [];
    let values_question = [];
    let values_string = '';
    for (let key in object) {
        values.push(object[key]);
        values_question.push('?');
    }
    values_string = '(' + values_question.join(',') + ')';
    return { values_string, values };
};
const fetchKeys = (object) => {
    const keys = [];
    for (let key in object) {
        keys.push(key);
    }
    return keys.join(',');
};

const sendMessagebyOrder = async (sender, order_id) => {
    try {
        const { shipback_id, is_order } = await hasAvailableOrder(order_id);
        if (shipback_id !== null) {
            let { public_url, charged, label_url } = await httpGet(`shipbacks/${shipback_id}`) || {};
            public_url = toPublicURL(public_url);
            if (charged == false) await saveOrderIdBySender(sender, { order_id, step: 1 });
            if (charged) {
                await sendMessageButton(sender, 'Tracking', 'Click to tracking your shipback', public_url);
                await sendMessageButton(sender, 'Download Label', 'Your shipback already return!. Please download label below', label_url, "false");
                return await sendTextMessage(sender, "Your order has been returned already! Please enter new order:");
            }
            return await sendTemplate(sender, public_url);
        }
        if (shipback_id == null && is_order == true) {
            const { shipback } = await createShipback(order_id);
            await sendTextMessage(sender, JSON.stringify(shipback));
            await saveOrderIdBySender(sender, { order_id, step: 1 });
            await sendTemplate(sender, shipback.public_url);
            return;
        }
        await sendTextMessage(sender, "Sorry, your order has not registered. Please enter again");
    } catch (error) {
        await sendTextMessage(sender, error.toString());
    }

};
const saveOrderIdBySender = async (sender, object = {}) => {
    const { success } = await update('sessions', object, { sender });
    return success;
};
const hasAvailableOrder = async (order_id) => {
    const order_url = `orders/${order_id}`;
    const { shipback_id, id } = await httpGet(order_url) || {};
    if (shipback_id !== undefined) return { shipback_id };
    if (id !== undefined && shipback_id == undefined) return { shipback_id: null, is_order: true };
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
        condition = i == 0 ? `${condition} ${key}=?` : `${condition} ${terminate} ${key}=?`;
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
    await sendMessageButton(sender, 'Return shipback', 'Click button below to return shipback', web_url);
    return { success: true };
}
const toPublicURL = (public_url) => {
    const new_url = process.env.WEB_URL;
    const srb_web_url = 'https://staging.v2.shoprunback.com';
    return public_url.replace(srb_web_url, new_url);
};
const sendMessageButton = async (sender, title, message, web_url, extension = "true") => {
    const payload = {
        recipient: {
            id: sender
        },
        message: {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": message,
                    "buttons": [
                        {
                            "type": "web_url",
                            "url": web_url,
                            "title": title,
                            "webview_height_ratio": "full",
                            "messenger_extensions": extension
                        }
                    ]
                }
            }
        }
    };
    const res = await httpPost('', payload, 'fb');
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
    return await httpRequest(url[type], 'GET', {}, headers[type]);
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
            if (error) resolve(error);
            resolve(body);
        });
    });
};
app.listen(port, () => console.log(`Chatbot Return listening on port ${port}!`))