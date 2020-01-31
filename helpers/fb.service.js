import { FB_URL } from '../config';
import { httpRequest } from './http';

const callAPI = async (endpoint, payload, queryParams = {}) => {
	const url = `${FB_URL}/${endpoint}`;
	return await httpRequest(url, 'POST', payload, queryParams);
}

const callMessagesAPI = (payload, headers = {}) => {
	return callAPI('messages', payload, headers);
};

const callMessengerProfileAPI = (payload, headers = {}) => {
	return callAPI('messenger_profile', payload, headers);
};

export default {
	callMessagesAPI,
	callMessengerProfileAPI,
};