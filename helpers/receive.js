const fbSend = require('./send');
const query = require('./query');

const handleReceiveMessage = async (event, page_id) => {
    try {
        const { access_token } = await query.user.fetchUser(page_id);
        const message = event.message;
        const senderId = event.sender.id;
        await fbSend.sendReadReceipt(senderId, access_token);
        if(message.text) {
            await handleMessage(senderId, page_id, message.text, access_token);   
        }
    } catch (error) {
        console.log(error);
    }
};

const handlePostbackMessage = async (event, page_id) => {
    const { access_token } = await query.user.fetchUser(page_id);
    const { payload } = event.postback;
    const senderId = event.sender.id;
    if (payload == '<postback_payload>') return await handlePostbackGetStarted(senderId, page_id, access_token);
    await fbSend.sendMessage(senderId, { text: JSON.stringify(message) }, access_token);
};

const handlePostbackGetStarted = async (sender, page_id, access_token) => {
    await query.session.delete({ sender });
    const stores = await query.store.hasStore(page_id);
    await fbSend.sendMessage(
        senderId, 
        [
            { text: 'Welcome to shoprunback return system.' },
            { text: 'Please choose the store below:' }
        ], 
        access_token
    );
    if (!stores) return await fbSend.sendUnavailableStore(senderId, access_token);
    return await fbSend.sendStoreList(senderId, stores, access_token);
}

const handleReferralMessage = async (event, page_id) => {
    const { access_token } = await query.user.fetchUser(page_id);
    const message = event.referral;
    const senderId = event.sender.id;
};

const handleMessage = async (senderId, page_id, message, access_token) => {
    const stores = await query.store.hasStore(page_id);
    const store_name = await query.session.hasSelectedStore(senderId);
    if (store_name) return await handleReturnMessage(senderId, message, access_token);
    if (!stores) return await fbSend.sendUnavailableStore(senderId, access_token);
    return await fbSend.sendStoreList(senderId, stores, access_token);
};

const handleReturnMessage = async (senderId, message, access_token) => {
    await fbSend.sendPleaseEnterOrder(senderId, access_token);
};

module.exports = {
    handleReceiveMessage,
    handlePostbackMessage,
    handleReferralMessage
}