import fbSend from './send';

const handleReceiveMessage = (event) => {
    const message = event.message;
    const senderId = event.sender.id;
    fbSend.sendReadReceipt(senderId);
    if (message.text) { fbSend.sendTextEnterOrderId(senderId); }
};