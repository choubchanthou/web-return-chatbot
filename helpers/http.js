const request = require('request');

const httpRequest = (url, method, json = {}, headers = {}, retries = 5) => {
    console.log(JSON.stringify(json));
    if (retries < 0) {
        console.error('No more retries left.', { url, method, json, headers });
        return;
    }
    return new Promise((resolve, reject) => {
        request({
            url: `${url}`,
            method,
            headers: headers,
            qs: headers,
            json
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve(body);
            } else {
                console.error(
                    `Failed calling Messenger API endpoint ${url}`,
                    response.statusCode,
                    response.statusMessage,
                    body.error,
                    headers
                );
                httpRequest(url, method, headers, retries - 1);
            }
        });
    });
};

module.exports = {
    httpRequest
};