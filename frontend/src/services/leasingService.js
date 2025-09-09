import api from '../utils/axios';

// =================== LEASING APPLICANTS ===================

export const leasingApplicantService = {
  // Get all leasing applicants with optional filters
  getApplicants: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/api/leasing/applicants?${params}`);
    return response.data;
  },

  // Create a new leasing applicant
  createApplicant: async (applicantData) => {
    const response = await api.post('/api/leasing/applicants', applicantData);
    return response.data;
  },

  // Update an existing leasing applicant
  updateApplicant: async (applicantId, applicantData) => {
    const response = await api.put(`/api/leasing/applicants/${applicantId}`, applicantData);
    return response.data;
  },

  // Delete a leasing applicant
  deleteApplicant: async (applicantId) => {
    const response = await api.delete(`/api/leasing/applicants/${applicantId}`);
    return response.data;
  }
};

// =================== APPLICANT GROUPS ===================

export const applicantGroupService = {
  // Get all applicant groups with optional filters
  getGroups: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/api/leasing/applicant-groups?${params}`);
    return response.data;
  },

  // Create a new applicant group
  createGroup: async (groupData) => {
    const response = await api.post('/api/leasing/applicant-groups', groupData);
    return response.data;
  },

  // Update an existing applicant group
  updateGroup: async (groupId, groupData) => {
    const response = await api.put(`/api/leasing/applicant-groups/${groupId}`, groupData);
    return response.data;
  },

  // Delete an applicant group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/api/leasing/applicant-groups/${groupId}`);
    return response.data;
  }
};

// =================== DRAFT LEASES ===================

export const draftLeaseService = {
  // Get all draft leases with optional filters
  getDraftLeases: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/api/leasing/draft-leases?${params}`);
    return response.data;
  },

  // Create a new draft lease
  createDraftLease: async (draftData) => {
    const response = await api.post('/api/leasing/draft-leases', draftData);
    return response.data;
  },

  // Update an existing draft lease
  updateDraftLease: async (draftId, draftData) => {
    const response = await api.put(`/api/leasing/draft-leases/${draftId}`, draftData);
    return response.data;
  },

  // Delete a draft lease
  deleteDraftLease: async (draftId) => {
    const response = await api.delete(`/api/leasing/draft-leases/${draftId}`);
    return response.data;
  }
};

// =================== PROPERTY LISTING STATUS ===================

export const propertyListingService = {
  // Get property listing statuses
  getListingStatuses: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/api/leasing/property-listing-status?${params}`);
    return response.data;
  },

  // Create or update property listing status
  createOrUpdateListingStatus: async (statusData) => {
    const response = await api.post('/api/leasing/property-listing-status', statusData);
    return response.data;
  }
};

// =================== DASHBOARD STATS ===================

export const leasingDashboardService = {
  // Get leasing dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/api/leasing/dashboard-stats');
    return response.data;
  }
};

// =================== COMBINED SERVICE ===================

const leasingService = {
  applicants: leasingApplicantService,
  groups: applicantGroupService,
  draftLeases: draftLeaseService,
  listings: propertyListingService,
  dashboard: leasingDashboardService
};

export default leasingService;
