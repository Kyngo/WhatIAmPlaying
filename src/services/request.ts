import axios from 'axios';

axios.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.data) {
        return Promise.resolve(error.response);
    }
    return Promise.resolve({data: 'unknown error'});
});

export default axios;