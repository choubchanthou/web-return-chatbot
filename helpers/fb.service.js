import { FB_URL } from '../config';
import { httpRequest } from './http';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';

const callAPI = async (endpoint, messageDataArray, queryParams = {}) => {
	const url = `${FB_URL}/${endpoint}`;
	const [payload, ...queue] = castArray(messageDataArray);
	await httpRequest(url, 'POST', payload, queryParams);
	if (!isEmpty(queue)) {
        return await callAPI(endPoint, queue, queryParams);
    }
	return;
}

const callMessagesAPI = async (messageDataArray, access_token) => {
	if(!access_token) throw new TypeError("Unauthorize");
	return await callAPI('messages', messageDataArray, { access_token });
};

const callMessengerProfileAPI = async (messageDataArray, access_token) => {
	if(!access_token) throw new TypeError("Unauthorize");
	return await callAPI('messenger_profile', messageDataArray, { access_token });
};

export default {
	callMessagesAPI,
	callMessengerProfileAPI,
};