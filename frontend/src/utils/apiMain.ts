import axios, { AxiosInstance } from 'axios';
import { baseURL } from '../config/config';

const apiMain: AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiMain.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiMain;
