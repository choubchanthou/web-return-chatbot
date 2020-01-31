import { FB_URL } from '../config';
import { httpRequest } from './http';

const callAPI = async (endpoint, payload, queryParams = {}) => {
	const url = `${FB_URL}/${endpoint}`;
	return await httpRequest(url, 'POST', payload, queryParams);
}

const callMessagesAPI = async (payload, access_token) => {
	if(!access_token) throw new TypeError("Unauthorize");
	return await callAPI('messages', payload, { access_token });
};

const callMessengerProfileAPI = async (payload, access_token) => {
	if(!access_token) throw new TypeError("Unauthorize");
	return await callAPI('messenger_profile', payload, { access_token });
};

export default {
	callMessagesAPI,
	callMessengerProfileAPI,
};