import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';
import TenantDashboard from './TenantDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  // Route to appropriate dashboard based on user role
  if (user?.role === 'TENANT') {
    return <TenantDashboard />;
  }
  
  // Default to property owner dashboard
  return <Dashboard />;
};

export default DashboardRouter;
