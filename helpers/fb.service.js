import { FB_URL } from '../config';
import { httpRequest } from './http';

const callAPI = async (endpoint, payload, queryParams = {}) => {
	const url = `${FB_URL}/${endpoint}`;
	return await httpRequest(url, 'POST', payload, queryParams);
}

const callMessagesAPI = async (payload, headers = {}) => {
	return await callAPI('messages', payload, headers);
};

const callMessengerProfileAPI = async (payload, headers = {}) => {
	return await callAPI('messenger_profile', payload, headers);
};

export default {
	callMessagesAPI,
	callMessengerProfileAPI,
};