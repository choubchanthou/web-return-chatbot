const fbSend = require('./send');
const query = require('./query');

const handleReceiveMessage = (event, page_id) => {
    try {
        const { access_token } = query.user.find({ page_id });
        console.log(access_token);
        const message = event.message;
        const senderId = event.sender.id;
        fbSend.sendReadReceipt(senderId, access_token);
        if (message.text) { fbSend.sendTextEnterOrderId(senderId, access_token); }
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    handleReceiveMessage
}