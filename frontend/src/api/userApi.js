import axios from 'axios';
import { getToken } from '../utils/token';

const API_URL = process.env.REACT_APP_API_URL || 'https://taskmanagerapp-sakshibishnoi.onrender.com/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const updateUser = async (userData) => {
  try {
    const response = await axiosInstance.put('/api/auth/me', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error updating user');
  }
};

export const getUserData = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error fetching user data');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('getCurrentUser error:', error.response?.data || error);
    throw error;
  }
};
