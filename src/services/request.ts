/**
 * Axios requester service
 * This file modifies Axios to not throw errors when a response is received
 */

import axios from 'axios';

axios.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.data) {
        return Promise.resolve(error.response);
    }
    return Promise.resolve({status: 0, data: 'unknown error'});
});

export default axios;