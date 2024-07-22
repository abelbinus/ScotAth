import axios, { AxiosInstance } from "axios";
import axiosConfig from "../config";

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