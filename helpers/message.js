import { WEB_URL } from '../config';

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
                setPreferencesButton,
                changeGiftButton
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

const returnShipback = (url) => {
    const title = 'Return shipback';
    const message = 'Click button below to return shipback';
    return messageButton({
        title,
        url,
        message
    });
}

export default {
    getStarted,
    setPreferencesButton,
    messageButton
}