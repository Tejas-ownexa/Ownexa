import axios from '../utils/axios';

const associationService = {
  // Get all associations
  getAssociations: async () => {
    const response = await axios.get('/api/associations');
    return response.data;
  },

  // Get a specific association by ID
  getAssociation: async (id) => {
    const response = await axios.get(`/api/associations/${id}`);
    return response.data;
  },

  // Create a new association
  createAssociation: async (associationData) => {
    const response = await axios.post('/api/associations', associationData);
    return response.data;
  },

  // Update an existing association
  updateAssociation: async (id, associationData) => {
    const response = await axios.put(`/api/associations/${id}`, associationData);
    return response.data;
  },

  // Delete an association
  deleteAssociation: async (id) => {
    const response = await axios.delete(`/api/associations/${id}`);
    return response.data;
  },

  // Get properties that are not assigned to any association for this user
  getAvailableProperties: async (associationId) => {
    const response = await axios.get(`/api/associations/${associationId}/available-properties`);
    // API returns { available_properties: [...] }
    return response.data.available_properties || [];
  },

  // Assign a property to an association with fees and shipping address
  assignProperty: async (associationId, payload) => {
    const response = await axios.post(`/api/associations/${associationId}/assign-property`, payload);
    return response.data;
  }
};

export default associationService;
