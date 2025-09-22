import axios from '../utils/axios';

const leaseRenewalService = {
  getLeaseRenewals: async () => {
    const response = await axios.get('/api/leasing/lease-renewals');
    return response.data;
  },
};

export default leaseRenewalService;
