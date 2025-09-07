// utils/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

// Create a single axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => {
    console.log(`Response received from: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.code, error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - check if backend server is running');
    } else if (error.response?.status === 404) {
      console.error('Endpoint not found - check route configuration');
    } else if (!error.response) {
      console.error('Network error - backend might be down');
    }
    
    return Promise.reject(error);
  }
);

// Document APIs - with shorter timeouts
export const documentAPI = {
  upload: (formData) => {
    return api.post('/api/upload', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      timeout: 30000,
    });
  },
  
  getAll: () => api.get('/api/files', { timeout: 10000 }),
  
  delete: (id) => api.delete(`/api/files/${id}`, { timeout: 10000 }),
  
  // Fixed search endpoint
  search: (query) => api.get(`/api/search?q=${encodeURIComponent(query)}`, { timeout: 10000 }),
  
  advancedSearch: (params) => api.get('/api/search/advanced', {
    params,
    timeout: 10000 
  }),
  
  getById: (id) => api.get(`/api/files/${id}`, { timeout: 10000 }),
  
  // Add the missing methods for document pages
  getPages: (id) => api.get(`/api/document/${id}/pages`, { timeout: 8000 }),
  
  getPage: (id, pageNumber) => api.get(`/api/document/${id}/page/${pageNumber}`, { timeout: 10000 }),
  
  getSummary: (id, options = {}) => api.get(`/api/document/${id}/summary`, {
    params: options,
    timeout: 15000 
  }),

  // Get annotations for a specific page
  getAnnotations: (documentId, pageNumber) => {
    return axios.get(`/api/documents/${documentId}/annotations?page=${pageNumber}`);
  },
  
  // Add annotation
  addAnnotation: (documentId, annotationData) => {
    return axios.post(`/api/documents/${documentId}/annotations`, annotationData);
  },
  
  // Get all annotations for a document
  getAllAnnotations: (documentId) => {
    return axios.get(`/api/documents/${documentId}/annotations/all`);
  },
  
  // Delete annotation
  deleteAnnotation: (documentId, annotationId) => {
    return axios.delete(`/api/documents/${documentId}/annotations/${annotationId}`);
  }
};

// Chat API
export const chatAPI = {
  sendMessage: (message, history = []) => 
    api.post('/api/chat', { 
      message, 
      history 
    }, {
      timeout: 30000
    }),
};

// Analytics API
export const analyticsAPI = {
  getTrends: () => api.get('/api/analytics/trends', {
    timeout: 15000
  }),
  
  getTimeline: () => api.get('/api/analytics/timeline', {
    timeout: 15000
  }),
};

// Health check
export const healthCheck = () => api.get('/api/health', {
  timeout: 5000
});

// Export the base api instance for custom requests
export default api;