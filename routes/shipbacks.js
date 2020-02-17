const fbSend = require('../helpers/send');
const express = require('express');
const router = express.Router();
const query = require('../helpers/query');

router.post('/shipbacks/finish', async (req, res) => {
    const { psid, label_url, voucher_url, order_number } = req.body || {};
    const { sender, page_id } = await query.session.fetchSession(psid);
    console.log('fetch session', { sender, page_id });
    const { access_token } = await query.user.fetchUser(page_id);
    await query.session.delete({ sender });
    await fbSend.sendReadReceipt(sender, access_token);
    await fbSend.sendMessageOrderReturned(sender,{  label_url, voucher_url, order_number }, access_token);
    res.json(req.body); 
});

module.exports = router;