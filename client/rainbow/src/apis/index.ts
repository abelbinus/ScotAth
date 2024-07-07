import axios, { AxiosInstance } from "axios";
import axiosConfig from "../config";
import { get } from "http";

// Find the IPv4 address of the Ethernet interface
// const port = process.env.PORT || 5908;
// const machineIp = process.env.IP || 'localhost';

// Create axios instance with dynamic baseURL
// const request = axios.create({
//   baseURL: `http://${axiosConfig.IP}:${axiosConfig.PORT}`,
//   timeout: 5000,
// });

let axiosInstance: AxiosInstance;

export const createAxiosInstance = ()=>{
    axiosInstance = axios.create({
        baseURL: `http://${axiosConfig.IP}:${axiosConfig.PORT}`,
        timeout: 5000,
    });
}

export const getAxiosInstance = ()=>{
    if(!axiosInstance){
        throw new Error("Axios instance not created");
    }
    return axiosInstance;
}


// let request = getAxiosInstance();
// // request interceptor
// request!.interceptors.request.use((config) => {
//     // auth token
//     const token = localStorage.getItem("AUTH_TOKEN");
//     console.log(token);
//     console.log("machineIpc",axiosConfig.IP);
//     console.log("port", axiosConfig.PORT);
//     if (token) {
//         config.headers["authorization"] = token;
//     }
//     return config;
// }, (error: any) => {
//     return Promise.reject(error);
// })


// // response interceptor
// request!.interceptors.response.use((response: any) => {
//     return response;
// }, (error: any) => {
//     return Promise.reject(error);
// })

// export { request }