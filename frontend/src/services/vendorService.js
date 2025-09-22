import api from '../utils/axios';

// Vendor Categories
export const getVendorCategories = async () => {
  const response = await api.get('/vendors/categories');
  return response.data;
};

export const createVendorCategory = async (categoryData) => {
  const response = await api.post('/vendors/categories', categoryData);
  return response.data;
};

export const deleteVendorCategory = async (categoryId) => {
  const response = await api.delete(`/vendors/categories/${categoryId}`);
  return response.data;
};

// Vendors
export const getVendors = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  
  const response = await api.get(`/vendors?${params}`);
  return response.data;
};

export const getVendor = async (vendorId) => {
  const response = await api.get(`/vendors/${vendorId}`);
  return response.data;
};

export const createVendor = async (vendorData) => {
  const response = await api.post('/vendors', vendorData);
  return response.data;
};

export const updateVendor = async (vendorId, vendorData) => {
  const response = await api.put(`/vendors/${vendorId}`, vendorData);
  return response.data;
};

export const deleteVendor = async (vendorId) => {
  const response = await api.delete(`/vendors/${vendorId}`);
  return response.data;
};

export const exportVendors = async () => {
  const response = await api.get('/vendors/export', {
    responseType: 'blob'
  });
  return response.data;
};
