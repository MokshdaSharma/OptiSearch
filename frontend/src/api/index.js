import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Document API
export const documentAPI = {
  upload: (formData, onProgress) => {
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress && onProgress(percentCompleted);
      }
    });
  },
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  getPages: (id) => api.get(`/documents/${id}/pages`),
  getPage: (id, pageNumber) => api.get(`/documents/${id}/pages/${pageNumber}`),
  reprocess: (id, data) => api.post(`/documents/${id}/reprocess`, data),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`)
};

// Search API
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  searchDocument: (documentId, params) => api.get(`/search/document/${documentId}`, { params }),
  advancedSearch: (data) => api.post('/search/advanced', data),
  getSuggestions: (query) => api.get('/search/suggestions', { params: { q: query } })
};

// Job API
export const jobAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  cancel: (id) => api.post(`/jobs/${id}/cancel`)
};

export default api;
