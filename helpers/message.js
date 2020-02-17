const { WEB_URL } = require('../config');

const toPublicURL = (url) => {
    const srb_web_url = 'https://staging.v2.shoprunback.com';
    const srb_web_url2 = 'http://staging.web.shoprunback.com';
    let web_url = url.replace(srb_web_url, WEB_URL);
    web_url = web_url.replace(srb_web_url2, WEB_URL);
    return web_url;
}

const setPreferencesButton = (options, ext = true) => {
    const { title, url } = options || {};
    return {
        type: 'web_url',
        title,
        url: toPublicURL(url),
        webview_height_ratio: 'full',
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
    const { url, title } = options || {};
    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                buttons: [
                    setPreferencesButton({ url, title }, ext)
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

const showTracking = (url, order_id) => {
    const title = `Track Shipping(${order_id})`;
    return messageButton({
        title,
        url
    });
}

const downloadLabel = (url) => {
    const title = 'Download Label';
    const message = 'Click here';
    return messageButton({
        title,
        url,
        message
    }, false);
}

const downloadVoucher = (url) => {
    const title = 'Download Voucher';
    const message = 'Click here';
    return messageButton({
        title,
        url,
        message
    }, false);
}

const showDownloadVoucherLabel = (object = {}) => {
    const { label_url, voucher_url } = object;
    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                buttons: [
                    setPreferencesButton({ url: label_url, title: 'Download Label' }, false),
                    setPreferencesButton({ url: voucher_url, title: 'Download Voucher' }, false)
                ]
            }
        }
    }
}

const returnShipback = (url, order_id) => {
    const title = `Return order(${order_id})`;
    return messageButton({
        title,
        url
    });
}

const notFoundOrderText = {
    text: 'Your order is not available.'
}

const showEnterOrderText = {
    text: 'Please input your order number:'
}

const notFoundStoreText = {
    text: 'Your store is not available.'
}

const messageSelectMerchant = {
    text: 'Please select merchant'
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
const buttonTemplate = (label, buttons) => {
    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: label,
                buttons: buttons
            }
        }
    }
};
const buttonContactSupport = (web_url) => {
    return {
        url: web_url,
        type: "web_url",
        title: 'CONTACT SUPPORT'
    };
};
const buttonReturnItem = {
    type: "postback",
    title: 'RETURN ITEM',
    payload: 'postback_return'
};

const messageWelcome = (contact_url) => {
    const buttons = [
        buttonReturnItem,
        buttonContactSupport(contact_url)
    ];
    const welcomeText = { text: 'Welcome to ShopRunBack!' };
    const label = 'What can we help you?'
    return [welcomeText, buttonTemplate(label, buttons)];
};

const messageRestartProccess = () => {
    const label = "Please click reset button to restart the process.";
    const buttons = [{
        type: "postback",
        title: 'RESET',
        payload: 'postback_reset'
    }];
    console.log('message restart process',  buttonTemplate(label, buttons));
    return buttonTemplate(label, buttons);
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
    messageSelectMerchant,
    showSelectedOrderText,
    persistentMenu,
    downloadVoucher,
    messageButtonPostback,
    setElement,
    unavailableStoreText,
    showDownloadVoucherLabel,
    messageWelcome,
    messageRestartProccess
}