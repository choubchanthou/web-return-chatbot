const request = require('request');

const httpRequest = (url, method, json = {}, headers = {}) => {
    return new Promise((resolve) => {
        request({
            url: `${url}`,
            method,
            headers,
            qs: headers,
            json
        }, (error, response, body) => {
            if (error) resolve(error);
            resolve(body || {});
        });
    });
};

module.exports = {
    httpRequest
};