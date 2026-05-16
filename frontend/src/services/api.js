import axios from 'axios';

// Base URL is configurable via environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const vehicleApi = {
  getAll: () => apiClient.get('/vehicle'),
  getById: (reg) => apiClient.get(`/vehicle/${reg}`),
  create: (data) => apiClient.post('/vehicle', data),
  delete: (id) => apiClient.delete(`/vehicle/${id}`),
};

export const locationApi = {
  getLocations: () => apiClient.get('/vehicle/location'),
  getHistory: (reg) => apiClient.get(`/vehicle/location/history/${reg}`),
};

export default apiClient;
