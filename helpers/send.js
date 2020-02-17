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
};

const sendMessageOrderReturned = async (recipientId, object ,access_token) => {
    return await sendMessage(
        recipientId,
        message.messageOrderReturned(object),
        access_token
    )
};

const sendTracking = async (recipientId, props, access_token) => {
    return await sendMessage(
        recipientId,
        message.showTracking(props),
        access_token
    )
}

const sendUnavailableStore = async (recipientId, access_token) => {
    return await sendMessage(
        recipientId,
        message.unavailableStoreText,
        access_token
    );
};

const sendMessageUnavailableOrderNumber = async (recipientId, access_token) => {
    return await sendMessage(
        recipientId,
        message.messageUnavailableOrderNumber(),
        access_token
    );
};

const sendStoreList = async (recipientId, stores, access_token) => {
    const messageArray = [];
    for(let store of stores) {
        messageArray.push(message.setElement({
            title: store.name,
            image_url: store.logo_url,
            payload: store.fb_token
        }));
    }
    return await sendMessage(
        recipientId, 
        message.messageButtonPostback(messageArray),
        access_token
    );
};

const sendPleaseEnterOrder = async (recipientId, access_token) => {
    return await sendMessage(
        recipientId,
        message.showEnterOrderText,
        access_token
    );
};

const sendReturnShipback = async (recipientId, props, access_token) => {
    console.log('props return shipback on send.js', props);
    return await sendMessage(
        recipientId,
        message.returnShipback(props),
        access_token
    );
}
const sendMessageWelcome = async (recipientId, contact_url, access_token) => {
    return await sendMessage(
        recipientId,
        message.messageWelcome(contact_url),
        access_token
    );
};
const sendMessageSelectMerchant = async (recipientId, access_token) => {
    return await sendMessage(
        recipientId,
        message.messageSelectMerchant,
        access_token
    );
};
const sendOnlyMessageWelcome = async(recipientId, persons, access_token) => {
    return await sendMessage(
        recipientId,
        message.onlyMessageWelcome(persons),
        access_token
    );
}

const sendFetchPerson = async(recipientId, access_token) => {
    return await fbAPI.callGetPersonAPI(recipientId, access_token);
};
module.exports = {
    sendMessage,
    sendReadReceipt,
    sendTextEnterOrderId,
    sendMessageOrderReturned,
    sendStoreList,
    sendUnavailableStore,
    sendPleaseEnterOrder,
    sendReturnShipback,
    sendTracking,
    sendMessageWelcome,
    sendMessageSelectMerchant,
    sendMessageUnavailableOrderNumber,
    sendOnlyMessageWelcome,
    sendFetchPerson
};