const fbSend = require('../helpers/send');
const express = require('express');
const router = express.Router();
const query = require('../helpers/query');

router.post('/shipbacks/finish', async (req, res) => {
    const { order_number, label_url, voucher_url, page_id } = req.body || {};
    const { sender } = await query.session.find({ order_id: order_number });
    const { access_token } = await query.user.find({ page_id });
    await query.session.delete({ sender });
    await fbSend.sendReadReceipt(sender, access_token);
    await fbSend.sendDownloadLabelVoucher(sender,{ label_url, voucher_url }, access_token);
    res.json({ success: true });
});

router.get('/shipbacks/test', async (req, res) => {
    const page_id = '102876274588508';
    const data = await query.store.hasStore(page_id);
    res.json(data);
});

module.exports = router;