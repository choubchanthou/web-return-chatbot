const fbAPI = require('./fb.service');
const castArray = require('lodash/castArray');
const message = require('./message');

const typingOn = (recipientId) => {
    return {
        recipient: {
            id: recipientId,
        },
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

const sendReadReceipt = (recipientId, access_token) => {
    const messageData = {
        recipient: { id: recipientId },
        sender_action: 'mark_seen'
    };
    fbAPI.callMessagesAPI(messageData, access_token);
};

const sendTextEnterOrderId = async (recipientId, access_token) => {
    return await sendMessage(recipientId, message.showEnterOrderText, access_token);
}


module.exports = {
    sendMessage,
    sendReadReceipt,
    sendTextEnterOrderId
};