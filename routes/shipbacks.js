const fbSend = require('../helpers/send');
const express = require('express');
const router = express.Router();
const query = require('../helpers/query');
const srbAPI = require('../helpers/srb.service');

router.post('/shipbacks/finish', async (req, res) => {
    const { psid } = req.body || {};
    const { sender, page_id } = await query.session.fetchSession(psid);
    const { access_token } = await query.user.fetchUser(page_id);
    await query.session.delete({ sender });
    await fbSend.sendReadReceipt(sender, access_token);
    await fbSend.sendMessage(sender, { text: 'Thank you for using our service!' }, access_token);
    // await fbSend.sendDownloadLabelVoucher(sender,{  label_url, voucher_url }, access_token);
    res.json(req.body);
});

router.get('/shipbacks/test', async (req, res) => {
    // const page_id = '102876274588508';
    // const data = await query.store.hasStore(page_id);
    const orderId = '01a74af0-9687-4d81-ac1e-06e59f304c16';
    const token = 'HBAKqGDvojdVSZhsVsbE9jrYYoKSnC285-osaZAPMi-zpvsWEg';
    const {public_url} = await srbAPI.fetchShipback(orderId, token);
    console.log(public_url);
    res.json(public_url);
});

module.exports = router;