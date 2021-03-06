const { FB_URL } = require('../config');
const { httpRequest } = require('./http');
const castArray = require('lodash/castArray');
const isEmpty = require('lodash/isEmpty');

const callAPI = async (endpoint, messageDataArray, queryParams = {}) => {
	const url = `${FB_URL}/${endpoint}`;
	const [payload, ...queue] = castArray(messageDataArray);
	await httpRequest(url, 'POST', payload, queryParams);
	if (!isEmpty(queue)) {
        return await callAPI(endpoint, queue, queryParams);
    }
	return;
}

const callMessagesAPI = async (messageDataArray, access_token) => {
	if(!access_token) throw new TypeError("Unauthorize");
	return await callAPI('me/messages', messageDataArray, { access_token });
};

const callMessengerProfileAPI = async (messageDataArray, access_token) => {
	if(!access_token) throw new TypeError("Unauthorize");
	return await callAPI('me/messenger_profile', messageDataArray, { access_token });
};

const callGetPersonAPI = async (perID, access_token) => {
	const url = `${FB_URL}/${perID}?fields=first_name,last_name,profile_pic`;
	return await httpRequest(url, 'GET', {}, { access_token });
};

module.exports = {
	callMessagesAPI,
	callMessengerProfileAPI,
	callGetPersonAPI
};