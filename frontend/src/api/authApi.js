import axios from 'axios';
import { getToken } from '../utils/token';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
  
  if (
    !config || 
    config.url.includes('/auth/') || 
    (response && response.status >= 400 && response.status < 500)
  ) {
    return Promise.reject(error);
  }

  config.retryCount = config.retryCount || 0;
  if (config.retryCount >= 3) {
    return Promise.reject(error);
  }
  
  config.retryCount += 1;
  return new Promise(resolve => 
    setTimeout(() => resolve(axiosInstance(config)), 1000)
  );
});

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network error during registration');
  }
};

export const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('/api/auth/login', credentials);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 401) {
      throw {
        response: error.response,
        message: 'Invalid credentials'
      };
    }
    throw {
      message: 'Unable to connect to the server'
    };
  }
};

