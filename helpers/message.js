const { WEB_URL } = require('../config');

const toPublicURL = (url) => {
    const srb_web_url = 'https://staging.v2.shoprunback.com';
    return url.replace(srb_web_url, WEB_URL);
}

const setPreferencesButton = (options) => {
    const { title, url } = options || {};
    return {
        type: 'web_url',
        title,
        url: toPublicURL(url),
        webview_height_ratio: 'tall',
        messenger_extensions: true,
    };
}

const persistentMenu = {
    persistent_menu: [
        {
            'locale': 'default',
            'composer_input_disabled': false,
            'call_to_actions': [
                setPreferencesButton
            ]
        }
    ]
};


const getStarted = {
    get_started: {
        payload: 'GET_STARTED'
    }
};

const messageButton = (options) => {
    const { url, message, title} = options || {};
    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: message,
                buttons: [
                    setPreferencesButton({ url, title })
                ]
            }
        }
    };
};

const showTracking = (url) => {
    const title = 'Tracking';
    const message = 'Click below to tracking your shipback';
    return messageButton({
        title,
        url,
        message
    });
}

const downloadLabel = (url) => {
    const title = 'Download Label';
    const message = 'Your shipback already return!. Please download label below';
    return messageButton({
        title,
        url,
        message
    });
}

const downloadVoucher = (url) => {
    const title = 'Download Voucher';
    const message = 'Your shipback already return!. Please download voucher below';
    return messageButton({
        title,
        url,
        message
    });
}

const returnShipback = (url) => {
    const title = 'Return shipback';
    const message = 'Click button below to return shipback';
    return messageButton({
        title,
        url,
        message
    });
}

const notFoundOrderText = {
    text: 'Sorry, your order has not registered. Please enter again'
}

const showEnterOrderText = {
    text: 'Please enter your order number:'
}

const notFoundStoreText = {
    text: 'Sorry, your store has not registed. Please try again!'
}

const showEnterStoreText = {
    text: 'Please enter your store name:'
}

const showSelectedOrderText = (order_id) => {
    return {
        text: `You have an order(${order_id}) selected already!. Please say [new] to new return`
    }
}

module.exports = {
    getStarted,
    setPreferencesButton,
    messageButton,
    downloadLabel,
    showTracking,
    returnShipback,
    notFoundOrderText,
    showEnterOrderText,
    notFoundStoreText,
    showEnterStoreText,
    showSelectedOrderText,
    persistentMenu,
    downloadVoucher
}