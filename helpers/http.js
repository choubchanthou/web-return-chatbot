import request from 'request';

const httpRequest = (url, method, json = {}, headers = {}, retries = 5) => {
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
                    `Failed calling Messenger API endpoint ${endPoint}`,
                    response.statusCode,
                    response.statusMessage,
                    body.error,
                    queryParams
                );
                httpRequest(url, method, headers, retries - 1);
            }
        });
    });
};

export default {
    httpRequest
};