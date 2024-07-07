import axios from "axios";

const request = axios.create({
    baseURL: "http://localhost:5000",
    timeout: 5000,
})

// request interceptor
request.interceptors.request.use((config) => {
    // auth token
    const token = localStorage.getItem("AUTH_TOKEN");
    console.log(token);
    if (token) {
        config.headers["authorization"] = token;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
})

// response interceptor
request.interceptors.response.use((response) => {
    return response;
}, (error) => {
    return Promise.reject(error);
})

export { request }