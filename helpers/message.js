const { WEB_URL } = require('../config');

const toPublicURL = (url) => {
    const srb_web_url = 'https://staging.v2.shoprunback.com';
    return url.replace(srb_web_url, WEB_URL);
}

const setPreferencesButton = (options, ext = true) => {
    const { title, url } = options || {};
    return {
        type: 'web_url',
        title,
        url: toPublicURL(url),
        webview_height_ratio: 'tall',
        messenger_extensions: ext,
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

const messageButton = (options, ext = true) => {
    const { url, message, title } = options || {};
    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: message,
                buttons: [
                    setPreferencesButton({ url, title}, ext)
                ]
            }
        }
    };
};

const messageButtonPostback = (elements) => {
    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: elements
            }
        }
    }
}

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
    const message = '';
    return messageButton({
        title,
        url,
        message
    }, false );
}

const downloadVoucher = (url) => {
    const title = 'Download Voucher';
    const message = '';
    return messageButton({
        title,
        url,
        message
    }, false);
}

const returnShipback = (url) => {
    const title = 'Return shipback';
    const message = 'Please click the button below to start returning your item.';
    return messageButton({
        title,
        url,
        message
    });
}

const notFoundOrderText = {
    text: 'Your order is not available.'
}

const showEnterOrderText = {
    text: 'Please enter your order number:'
}

const notFoundStoreText = {
    text: 'Your store is not available.'
}

const showEnterStoreText = {
    text: 'Please enter your store name:'
}

const unavailableStoreText = {
    text: 'Your store is not available.'
}

const showSelectedOrderText = (order_id) => {
    return {
        text: `You have an order(${order_id}) selected already!. Please say [new] to new return`
    }
}

const setButtons = (title, payload) => {
    return [
        {
            type: "postback",
            title,
            payload
        }
    ]
}
const setElement = (options = {}) => {
    const { title, image_url, payload } = options;
    return {
        title,
        image_url,
        buttons: setButtons(title, payload)
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
    downloadVoucher,
    messageButtonPostback,
    setElement,
    unavailableStoreText
}