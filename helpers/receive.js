const fbSend = require('./send');
const query = require('./query');
const elements = [
    {
        title: "Welcome!",
        image_url: "https://s3.amazonaws.com/srb-staging/companies/817/e7d/55-/logos/main.png?1549875154",
        subtitle: "We have the right hat for everyone.",
        buttons: [
            {
                type: "postback",
                title: "Postback Button",
                payload: "DEVELOPER_DEFINED_PAYLOAD"
            }
        ]
    }
];

const handleReceiveMessage = async (event, page_id) => {
    try {
        const { access_token } = await query.user.find({ page_id });
        const message = event.message;
        const senderId = event.sender.id;
        await fbSend.sendReadReceipt(senderId, access_token);
        if (message.text) {
            await fbSend.sendStoreList(senderId, elements, access_token)
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    handleReceiveMessage
}