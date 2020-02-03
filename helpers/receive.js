const fbSend = require('./send');

const handleReceiveMessage = (event) => {
    const access_token = "EAAuL0vyhZBO0BAEcJ5DOkZADKzsKcYMDxK1QMdsZCs2Np2xCZAnrDPQqKGoLC5LVha07QVXxApYVc94SJLDDqy4KqV9wZAoXwjtl66SstkeoYIYsvNL3mZA31JW8rnBzn4sPKPNDDxuUAipKG9veAiT63ewVqI3YC8Ik5ljbM4UqngQ1PqfC04PKqn3lU7oIsZD";
    const message = event.message;
    const senderId = event.sender.id;
    fbSend.sendReadReceipt(senderId);
    // if (message.text) { fbSend.sendTextEnterOrderId(senderId, access_token); }
};

module.exports = {
    handleReceiveMessage
}