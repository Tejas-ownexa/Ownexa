import axios from 'axios';
import config from '../config';

// Set the base URL for all API calls
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 120000, // 2 minute timeout for file uploads
  maxContentLength: Infinity, // Allow large file uploads
  maxBodyLength: Infinity,
  headers: {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('📡 Axios Request:', config.url);
    console.log('📡 Token present:', token ? 'Yes' : 'No');
    console.log('📡 Request timestamp:', new Date().toISOString());
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set default Content-Type to JSON if not already specified
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    console.log('📡 Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('📡 Axios Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.log('📡 Axios Error:', error.config?.url, error.response?.status);
    console.log('📡 Axios Error details:', error.response?.data);
    console.log('📡 Axios Error timestamp:', new Date().toISOString());
    
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized - removing token and redirecting');
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      // Use a more reliable redirect method
      if (window.location.pathname !== '/login') {
        console.log('🚨 Redirecting to login page');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 