const fbSend = require('./send');
const query = require('./query');
const buttons = [
    {
        type: "postback",
        title: "Postback Button",
        payload: "DEVELOPER_DEFINED_PAYLOAD"
    }
];

const handleReceiveMessage = async (event, page_id) => {
    try {
        const { access_token } = await query.user.find({ page_id });
        const message = event.message;
        const senderId = event.sender.id;
        await fbSend.sendReadReceipt(senderId, access_token);
        if (message.text) {
            await fbSend.sendStoreList(senderId, buttons, access_token)
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    handleReceiveMessage
}