const fbSend = require('./send');
const query = require('./query');

const handleReceiveMessage = async (event, page_id) => {
    try {
        const { access_token } = await query.user.find({ page_id });
        const message = event.message;
        const senderId = event.sender.id;
        await fbSend.sendReadReceipt(senderId, access_token);
        if (message.text) {
            await handleMessage(senderId, page_id, message.text, access_token);
        }
    } catch (error) {
        console.log(error);
    }
};

const handlePostbackMessage = async (event, page_id) => {
    const { access_token } = await query.user.find({ page_id });
    const message = event.postback;
    const senderId = event.sender.id;
};

const handleReferralMessage = async (event, page_id) => {
    const { access_token } = await query.user.find({ page_id });
    const message = event.referral;
    const senderId = event.sender.id;
};

const handleMessage = async (senderId, page_id, message, access_token) => {
    try {
        const stores = await query.store.hasStore(page_id);
        console.log(stores);
        if (!stores) return await fbSend.sendUnavailableStore(senderId, access_token);
        await fbSend.sendStoreList(senderId, stores, access_token);
    } catch (error) {
        console.log(error);
    }
};

const displayStoreList = async (senderId, message, access_token) => {

};

module.exports = {
    handleReceiveMessage,
    handlePostbackMessage,
    handleReferralMessage
}