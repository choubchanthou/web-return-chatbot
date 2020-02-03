const db = require('./db');
const FB_URL = process.env.FB_URL || 'https://graph.facebook.com/v3.2/me';
const WEB_URL = process.env.WEB_URL || 'https://staging.v2.shoprunback.com';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://staging.dashboard.shoprunback.com/api/v1';
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'dev';
module.exports = {
    db,
    FB_URL,
    WEB_URL,
    DASHBOARD_URL,
    WEBHOOK_TOKEN
};