
import axios from 'axios';


const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/',
  headers: {
    
    'Content-Type': 'application/json',
  }
});


axiosInstance.interceptors.request.use(
  (config) => {
  
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    
    if (error.response) {
     
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
      
      
      if (error.response.status === 401) {
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
  
      console.error('No response received:', error.request);
    } else {
      
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;