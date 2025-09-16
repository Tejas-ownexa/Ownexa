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
  }
};

export default associationService;
