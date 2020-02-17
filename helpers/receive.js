const fbSend = require('./send');
const query = require('./query');
const srbAPI = require('./srb.service');

const handleReceiveMessage = async (event, page_id) => {
    try {
        const { access_token, contact } = await query.user.fetchUser(page_id);
        const message = event.message;
        const sender = event.sender.id;
        if (message.text) {
            await fbSend.sendReadReceipt(sender, access_token);
            const state = await handelState(sender, message.text, access_token);
            if(state != false) return state;
            return await initMessage(sender, contact, access_token);
        }
    } catch (error) {
        console.log(error);
    }
};

const handlePostbackMessage = async (event, page_id) => {
    const { access_token } = await query.user.fetchUser(page_id);
    const { payload } = event.postback;
    const senderId = event.sender.id;
    if (payload == '<USER_DEFINED_PAYLOAD>') return await initMessage(senderId, access_token);
    if (payload == 'postback_return') return await handlePostbackMerchant(senderId, page_id, access_token);
    if (payload) return await handlePostbackSelectStore(senderId, payload, access_token);
    return false;
};

const handleReferralMessage = async (event, page_id) => {
    const { access_token } = await query.user.fetchUser(page_id);
    const message = event.referral;
    const senderId = event.sender.id;
};

const initMessage = async (sender, contact, access_token) => {
    await query.session.delete({ sender });
    return fbSend.sendMessageWelcome(sender, contact, access_token);
}

const resetState = async(sender, state = null) => {
    if(state == null) return await query.session.delete({ sender });
    return await query.session.update({ state }, { sender });
};

const state = async(sender) => {
    const { state } = await query.session.fetchSession(sender) || {};
    return state == undefined ? 'unknown' : state; 
};
const setState = async(sender, stateText, more = {}) => {
    const _state = await state(sender);
    const params = Object.assign(more, { state: stateText,  sender: sender });
    if(_state == 'unknown') {
        console.log('create state', params);
        await query.session.delete({ sender });
        return await query.session.insert(params);
    }
    console.log('update state', params);
    return await query.session.update(params, { sender });
};

const handlePostbackMerchant = async (sender, page_id, access_token) => {
    const stores = await query.store.find({ page_id });
    await fbSend.sendMessageSelectMerchant(sender, access_token);
    return await fbSend.sendStoreList(sender, stores, access_token);
}

const handlePostbackSelectStore = async (sender, store_name, access_token) => {
    await setState(sender, 'start', { store_name });
    return await fbSend.sendPleaseEnterOrder(sender, access_token);
}

const handelState = async(sender, message, access_token) => {
    /* state list:
    1. unknown
    2. start
    3. proccess
    4. unavailable
    */
    const _state = await state(sender);
    console.log("fetch state", _state);
    if(_state == 'unknown') return false;
    if(_state == 'start') return await requestButtonOrder(sender, message, access_token);
};

const requestButtonOrder = async(sender, order_id, access_token) => {
    const { store_name } = await query.session.fetchSession(sender);
    const { token } = await query.store.fetchStore(store_name);
    const { order_number } = await srbAPI.fetchOrder(order_id, token);
    if (order_number == undefined) return await unavailableProcess(sender, access_token);
    return await handleMessageOrder(sender, order_number, access_token, token);
};

const unavailableProcess = async(sender, access_token) => {
    console.log('Unavailable process', 'set state unavailable');
    await setState(sender, 'unavailable');
    return await fbSend.sendTryEnterOrder(sender, access_token);
};

const handleReturnMessage = async (sender, store_name, message, access_token) => {
    try {
        const { token } = await query.store.fetchStore(store_name);
        if (!token) throw new TypeError("Unauthorize");
        const { order_number } = await srbAPI.fetchOrder(message, token);
        if (order_number == undefined) return await fbSend.sendTryEnterOrder(sender, access_token);
        return await handleMessageOrder(sender, order_number, access_token, token);
    } catch (error) {
        console.log(error);
    }
};

const handleMessageOrder = async (sender, order_number, access_token, token) => {
    try {
        const shipbacks = await srbAPI.createShipback(order_number, token);
        const shipback_id = shipbacks.id;
        if (shipback_id == undefined) {
            const messageRes = shipbacks.shipback.errors[0];
            let arrayMessage = messageRes.split('(');
            arrayMessage = arrayMessage[arrayMessage.length - 1];
            arrayMessage = arrayMessage.split(')');
            console.log(arrayMessage[0]);
            const { public_url, charged, label_url, voucher_url } = await srbAPI.fetchShipback(arrayMessage[0], token);
            if (charged) {
                await fbSend.sendTracking(sender, public_url, access_token);
                return await fbSend.sendDownloadLabelVoucher(sender, { label_url, voucher_url }, access_token);
            }
            return fbSend.sendReturnShipback(sender, public_url, access_token);
        }
        return await fbSend.sendReturnShipback(sender, shipbacks.public_url, access_token);
    } catch (error) {
        console.log(error);
    }
    // const { public_url } = await srbAPI.createShipback(order_number, token);
    // // await query.session.update({ shipback_id: id }, { sender });
    // return await fbSend.sendReturnShipback(sender, public_url, access_token);
}

module.exports = {
    handleReceiveMessage,
    handlePostbackMessage,
    handleReferralMessage
}