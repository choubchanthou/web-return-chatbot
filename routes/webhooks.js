const express = require('express');
import fbReceive from '../helpers/receive';
const router = express.Router();

router.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === process.env.WEBHOOK_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong token');
    }
});

router.post('/', (req, res) => {
    res.sendStatus(200);
    const data = req.body;
    if (data.object === 'page') {
        data.entry.forEach((pageEntry) => {
            pageEntry.messaging.forEach((messagingEvent) => {
                console.log({ messagingEvent });
                if (messagingEvent.message) {
                    fbReceive.handleReceiveMessage(messagingEvent);
                } else {
                    console.log('Webhook received unknown messagingEvent: ', messagingEvent);
                }
            });
        });
    }
});
module.exports = router;