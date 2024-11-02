import axios from 'axios';
import { getToken } from '../utils/token';

const API_URL = process.env.REACT_APP_API_URL || 'https://taskmanagerapp-sakshibishnoi.onrender.com';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

const isAuthRoute = (url) => url.includes('/api/auth/');

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && !isAuthRoute(config.url)) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject({
        message: 'Unable to connect to the server. Please check your internet connection.'
      });
    }

    const { config, response } = error;
    
    if (isAuthRoute(config.url)) {
      return Promise.reject(response?.data || error);
    }

    if (response && response.status >= 400 && response.status < 500) {
      return Promise.reject(error);
    }

    config.retryCount = config.retryCount || 0;
    if (config.retryCount >= 2) {
      return Promise.reject(error);
    }
    
    config.retryCount += 1;
    return new Promise(resolve => 
      setTimeout(() => resolve(axiosInstance(config)), 500)
    );
  }
);

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Network error during registration');
  }
};

export const login = async (formData) => {
  try {
    const response = await axiosInstance.post('/api/auth/login', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createTaskAssignmentNotification = async (data) => {
  try {
    const response = await axiosInstance.post('/api/notifications/task-assigned', data);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error.response?.data || error.message);
    throw error;
  }
};

