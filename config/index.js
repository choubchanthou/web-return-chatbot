const db = require('./db');
const FB_URL = process.env.FB_URL || 'https://graph.facebook.com/v3.2/me';
const WEB_URL = process.env.WEB_URL || 'https://staging.v2.shoprunback.com';
module.exports = {
    db,
    FB_URL,
    WEB_URL
};