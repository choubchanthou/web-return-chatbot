const fbSend = require('./send');
const query = require('./query');
const srbAPI = require('./srb.service');

const handleReceiveMessage = async (event, page_id) => {
    try {
        const { access_token } = await query.user.fetchUser(page_id);
        const message = event.message;
        const senderId = event.sender.id;
        await fbSend.sendReadReceipt(senderId, access_token);
        const messageHello = ['hi','Hi', 'Hello', 'hello'];
        if(messageHello.includes(message.text)) return await initMessage(senderId, access_token);
        if (message.text) {
            if(message.text == 'new') return await fbSend.sendMessage(senderId, { text: 'Please enter your store name:'}, access_token);
            if (message.text == 'new2') return await handlePostbackGetStarted(senderId, page_id, access_token);
            return await handleMessage(senderId, message.text, access_token);
        }
    } catch (error) {
        console.log(error);
    }
};

const handlePostbackMessage = async (event, page_id) => {
    const { access_token } = await query.user.fetchUser(page_id);
    const { payload } = event.postback;
    const senderId = event.sender.id;
    if (payload == '<postback_payload>') {
        return await initMessage(senderId, access_token);
    }
    if (payload) return await handlePostbackSelectStore(senderId, payload, access_token);
    return await fbSend.sendMessage(senderId, { text: JSON.stringify(payload) }, access_token);
};
const initMessage = async (sender, access_token) => {
    await query.session.delete({ sender });
    return await fbSend.sendMessage(
        sender,
        [
            { text: 'Welcome to ShopRunBack!' },
            { text: 'Please type \'new\' or \'new2\' to start the process' }
        ],
        access_token
    );
}
const handlePostbackGetStarted = async (sender, page_id, access_token) => {
    const stores = await query.store.hasStore(page_id);
    if (!stores) return await fbSend.sendUnavailableStore(sender, access_token);
    await fbSend.sendMessage(sender, { text: 'Please select your store' }, access_token);
    return await fbSend.sendStoreList(sender, stores, access_token);
}

const handlePostbackSelectStore = async (sender, store_name, access_token) => {
    await query.session.delete({ sender });
    await query.session.insert({ sender, store_name });
    return await fbSend.sendPleaseEnterOrder(sender, access_token);
}

const handleReferralMessage = async (event, page_id) => {
    const { access_token } = await query.user.fetchUser(page_id);
    const message = event.referral;
    const senderId = event.sender.id;
};

const handleMessage = async (senderId, message, access_token) => {
    // const stores = await query.store.hasStore(page_id);
    const store_name = await query.session.hasSelectedStore(senderId);
    if (store_name) return await handleReturnMessage(senderId, store_name, message, access_token);
    // if (!stores) return await fbSend.sendUnavailableStore(senderId, access_token);
    // return await fbSend.sendStoreList(senderId, stores, access_token);
    await query.session.delete({ senderId });
    await query.session.insert({ senderId, store_name });
    return await fbSend.sendPleaseEnterOrder(senderId, access_token);
};

const handleReturnMessage = async (sender, store_name, message, access_token) => {
    const { token } = await query.store.fetchStore(store_name);
    if (!token) throw new TypeError("Unauthorize");
    const { order_number } = await srbAPI.fetchOrder(message, token);
    if (order_number == undefined) return await fbSend.sendTryEnterOrder(sender, access_token);
    return await handleMessageOrder(sender, order_number, access_token, token);
};

const handleMessageOrder = async (sender, order_number, access_token, token) => {
    const shipbacks = await srbAPI.createShipback(order_number, token);
    const shipback_id = shipbacks.id;
    if(shipback_id == undefined) {
        const messageRes = shipbacks.shipback.errors[0];
        let arrayMessage = messageRes.split('(');
        arrayMessage = arrayMessage[arrayMessage.length -1];
        arrayMessage = arrayMessage.split(')');
        const { public_url, charged, label_url, voucher_url } = await srbAPI.fetchShipback(arrayMessage[0], token);
        if (charged) {
            await fbSend.sendTracking(sender, public_url, access_token);
            return await fbSend.sendDownloadLabelVoucher(sender, { label_url, voucher_url }, access_token);
        }
        return fbSend.sendReturnShipback(sender, public_url, access_token);
    }
    return await fbSend.sendReturnShipback(sender, shipbacks.public_url, access_token);
    
    // const { public_url } = await srbAPI.createShipback(order_number, token);
    // // await query.session.update({ shipback_id: id }, { sender });
    // return await fbSend.sendReturnShipback(sender, public_url, access_token);
}

module.exports = {
    handleReceiveMessage,
    handlePostbackMessage,
    handleReferralMessage
}