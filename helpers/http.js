const request = require('request');

const httpRequest = (url, method, json = {}, headers = {}, retries = 5) => {
    headers1 = {
        'Content-Type': 'application/json',
        'Authorization': 'Token token=HBAKqGDvojdVSZhsVsbE9jrYYoKSnC285-osaZAPMi-zpvsWEg'
    };
    if (retries < 0) {
        console.error('No more retries left.', { url, method, json, headers });
        return;
    }

    return new Promise((resolve) => {
        request({
            url: `${url}`,
            method,
            headers: headers1,
            qs: headers,
            json
        }, (error, response, body) => {
            if (error) resolve(error);
            resolve(body);
        });
    });
    // return new Promise((resolve) => {
    //     request({
    //         url: `${url}`,
    //         method,
    //         headers: headers1,
    //         qs: headers,
    //         json
    //     }, (error, response, body) => {
    //         if (response.statusCode === 200) {
    //             resolve(body);
    //         } else {
    //             console.log(body);
    //             httpRequest(url, method, headers, retries - 1);
    //         }
    //     });
    // });
};

module.exports = {
    httpRequest
};