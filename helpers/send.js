const fbAPI = require('./fb.service');
const castArray = require('lodash/castArray');
const message = require('./message');

const typingOn = (recipientId) => {
    return {
        recipient: { id: recipientId },
        sender_action: 'typing_on'
    };
};

const typingOff = (recipientId) => {
    return {
        recipient: { id: recipientId },
        sender_action: 'typing_off'
    };
};

const messageToJSON = (recipientId, messagePayload) => {
    return {
        recipient: { id: recipientId },
        message: messagePayload,
    };
};


const sendMessage = async (recipientId, messagePayloads, access_token) => {
    const messagePayloadArray = castArray(messagePayloads)
        .map((messagePayload) => messageToJSON(recipientId, messagePayload));

    return await fbAPI.callMessagesAPI([
        typingOn(recipientId),
        ...messagePayloadArray,
        typingOff(recipientId),
    ], access_token);
};

const sendReadReceipt = async (recipientId, access_token) => {
    const messageData = {
        recipient: { id: recipientId },
        sender_action: 'mark_seen'
    };
    await fbAPI.callMessagesAPI(messageData, access_token);
};

const sendTextEnterOrderId = async (recipientId, access_token) => {
    return await sendMessage(recipientId, message.showEnterOrderText, access_token);
}

const sendDownloadLabelVoucher = async (recipientId, urls ,access_token) => {
    return await sendMessage(
        recipientId,
        [
            message.downloadLabel(urls.label_url),
            message.downloadVoucher(urls.voucher_url)
        ],
        access_token
    )
}

const sendStoreList = async (recipientId, elements, access_token) => {
    return await sendMessage(recipientId, message.messageButtonPostback(elements), access_token);
}


module.exports = {
    sendMessage,
    sendReadReceipt,
    sendTextEnterOrderId,
    sendDownloadLabelVoucher,
    sendStoreList
};