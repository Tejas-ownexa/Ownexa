import axios from '../utils/axios';

const rentalOwnerService = {
  // Get all rental owners
  getRentalOwners: async () => {
    const response = await axios.get('/api/rental-owners/rental-owners');
    return response.data.rental_owners || [];
  },

  // Get a specific rental owner by ID
  getRentalOwner: async (id) => {
    const response = await axios.get(`/api/rental-owners/rental-owners/${id}`);
    return response.data;
  },

  // Create a new rental owner
  createRentalOwner: async (ownerData) => {
    const response = await axios.post('/api/rental-owners/rental-owners', ownerData);
    return response.data;
  },

  // Update an existing rental owner
  updateRentalOwner: async (id, ownerData) => {
    const response = await axios.put(`/api/rental-owners/rental-owners/${id}`, ownerData);
    return response.data;
  },

  // Delete a rental owner
  deleteRentalOwner: async (id) => {
    const response = await axios.delete(`/api/rental-owners/rental-owners/${id}`);
    return response.data;
  }
};

export default rentalOwnerService;
