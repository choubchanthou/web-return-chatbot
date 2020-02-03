const fbSend = require('./send');
const query = require('./query');
const elements = [
    {
        title: "Etam",
        image_url: "https://s3.amazonaws.com/srb-staging/companies/817/e7d/55-/logos/main.png?1549875154",
        subtitle: "Return with etam store",
        buttons: [
            {
                type: "postback",
                title: "Etam",
                payload: "ETAM_STORE"
            }
        ]
    },
    {
        title: "Dragon Store",
        image_url: "https://s3.amazonaws.com/srb-staging/companies/19e/ba6/d9-/logos/main.png?1563670189",
        subtitle: "Return with dragon store",
        buttons: [
            {
                type: "postback",
                title: "Dragon store",
                payload: "DRAGON_STORE"
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