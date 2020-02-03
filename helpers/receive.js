const fbSend = require('./send');
const query = require('./query');

const handleReceiveMessage = async (event, page_id) => {
    try {
        const { access_token } = await query.user.find({ page_id });
        const message = event.message;
        const senderId = event.sender.id;
        await fbSend.sendReadReceipt(senderId, access_token);
        await handleMessage(senderId, page_id, message.text, access_token);
    } catch (error) {
        console.log(error);
    }
};

const handlePostbackMessage = (event, page_id) => {
    const { access_token } = await query.user.find({ page_id });
    const message = event.postback;
    const senderId = event.sender.id;
};

const handleReferralMessage = (event, page_id) => {
    const { access_token } = await query.user.find({ page_id });
    const message = event.referral;
    const senderId = event.sender.id;
};

const handleMessage = async (senderId, page_id, message, access_token) => {
    const stores = await query.store.hasStore(page_id);
    if (!stores) return await fbSend.sendUnavailableStore(senderId, access_token);
    await fbSend.sendStoreList(senderId, stores, access_token);
};

const displayStoreList = async (senderId, message, access_token) => {

};

module.exports = {
    handleReceiveMessage,
    handlePostbackMessage
    handleReferralMessage
}