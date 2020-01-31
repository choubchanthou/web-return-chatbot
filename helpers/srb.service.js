import { DASHBOARD_URL } from '../config';
import { httpRequest } from './http';

const httpPost = async (endpoint, payload, token = null) => { 
    let headers = { 'Content-Type': 'application/json' };
    if (token != null) {
        headers = Object.assign(headers, {'Authorization': `Token token=${token}`});
    }
    const url = `${DASHBOARD_URL}/${endpoint}`;
    return await httpRequest(url[type], 'POST', payload, headers); 
}

const httpGET = async (endpoint, token = null) => { 
    let headers = { 'Content-Type': 'application/json' };
    if (token != null) {
        headers = Object.assign(headers, {'Authorization': `Token token=${token}`});
    }
    const url = `${DASHBOARD_URL}/${endpoint}`;
    return await httpRequest(url[type], 'GET', {}, headers); 
}

const fetchShipback = async (shipback_id, token = null) => {
    const endpoint = `shipbacks/${shipback_id}`;
    return await httpGET(endpoint, token)
}

const fetchOrder = async (order_id, token = null) => {
    const endpoint = `orders/${order_id}`;
    return await httpGET(endpoint, token)
}

const createShipback = async (order_id, token = null) => {
    const payload = { order_id };
    return await httpPost('shipbacks', payload, token);
}

export default {
    fetchShipback,
    fetchOrder,
    createShipback
}