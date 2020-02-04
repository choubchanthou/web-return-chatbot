const fbSend = require('./send');
const query = require('./query');
const srbAPI = require('./srb.service');

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
    if (payload) return await handlePostbackSelectStore(senderId, payload, access_token);
    return await fbSend.sendMessage(senderId, { text: JSON.stringify(payload) }, access_token);
};

const handlePostbackGetStarted = async (sender, page_id, access_token) => {
    await query.session.delete({ sender });
    const stores = await query.store.hasStore(page_id);
    await fbSend.sendMessage(
        sender, 
        [
            { text: 'Welcome to shoprunback return system.' },
            { text: 'Please choose the store below:' }
        ], 
        access_token
    );
    if (!stores) return await fbSend.sendUnavailableStore(sender, access_token);
    return await fbSend.sendStoreList(sender, stores, access_token);
}

const handlePostbackSelectStore = async (sender, store_name , access_token) => {
    await query.session.delete({ sender });
    await query.session.insert({ sender , store_name });
    return await fbSend.sendPleaseEnterOrder(sender, access_token);
}

const handleReferralMessage = async (event, page_id) => {
    const { access_token } = await query.user.fetchUser(page_id);
    const message = event.referral;
    const senderId = event.sender.id;
};

const handleMessage = async (senderId, page_id, message, access_token) => {
    const stores = await query.store.hasStore(page_id);
    const store_name = await query.session.hasSelectedStore(senderId);
    if (store_name) return await handleReturnMessage(senderId, store_name, message, access_token);
    if (!stores) return await fbSend.sendUnavailableStore(senderId, access_token);
    return await fbSend.sendStoreList(senderId, stores, access_token);
};

const handleReturnMessage = async (sender, store_name, message, access_token) => {
    try {
        const { token } = await query.store.fetchStore(store_name);
        if(!token) throw new TypeError("Unauthorize");
        const order = await srbAPI.fetchOrder(message, token);
        console.log(order);
        return await fbSend.sendMessage(sender, { text: JSON.stringify(order) }, access_token);
    } catch (error) {
        return await fbSend.sendMessage(sender, { text: error.toString() }, access_token);
    }
};

module.exports = {
    handleReceiveMessage,
    handlePostbackMessage,
    handleReferralMessage
}