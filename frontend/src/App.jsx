import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardRouter from './pages/DashboardRouter';

import PropertyDetail from './pages/PropertyDetail';
import AddProperty from './pages/AddProperty';
import Tenants from './pages/Tenants';
import Rentals from './pages/Rentals';
import RentalOwners from './pages/RentalOwners';
import RentRoll from './pages/RentRoll';
import OutstandingBalances from './pages/OutstandingBalances';
import MaintenanceRequests from './pages/MaintenanceRequests';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import MaintenanceRequest from './pages/MaintenanceRequest';
import VendorProfile from './pages/VendorProfile';

import Accountability from './pages/Accountability';
import Reporting from './pages/Reporting';
import './index.css';

const queryClient = new QueryClient();

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const RootRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'VENDOR') {
    return <Navigate to="/maintenance" />;
  }
  
  return <Navigate to="/dashboard" />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Sidebar />
              {/* Main content area - responsive padding */}
              <div className="md:ml-64 transition-all duration-300">
                <main className="p-4 md:p-8">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={
                      <PrivateRoute>
                        <DashboardRouter />
                      </PrivateRoute>
                    } />

                    <Route path="/properties/:id" element={
                      <PrivateRoute>
                        <PropertyDetail />
                      </PrivateRoute>
                    } />
                    <Route path="/add-property" element={
                      <PrivateRoute>
                        <AddProperty />
                      </PrivateRoute>
                    } />
                    <Route path="/tenants" element={
                      <PrivateRoute>
                        <Tenants />
                      </PrivateRoute>
                    } />
                    <Route path="/rentals" element={
                      <PrivateRoute>
                        <Rentals />
                      </PrivateRoute>
                    } />
                    <Route path="/rental-owners" element={
                      <PrivateRoute>
                        <RentalOwners />
                      </PrivateRoute>
                    } />
                    <Route path="/rent-roll" element={
                      <PrivateRoute>
                        <RentRoll />
                      </PrivateRoute>
                    } />
                    <Route path="/outstanding-balances" element={
                      <PrivateRoute>
                        <OutstandingBalances />
                      </PrivateRoute>
                    } />
                    <Route path="/maintenance" element={
                      <PrivateRoute>
                        <MaintenanceDashboard />
                      </PrivateRoute>
                    } />
                    <Route path="/maintenance/new" element={
                      <PrivateRoute>
                        <MaintenanceRequest />
                      </PrivateRoute>
                    } />
                    <Route path="/vendor-profile" element={
                      <PrivateRoute>
                        <VendorProfile />
                      </PrivateRoute>
                    } />

                    <Route path="/accountability" element={
                      <PrivateRoute>
                        <Accountability />
                      </PrivateRoute>
                    } />
                    <Route path="/reports" element={
                      <PrivateRoute>
                        <Reporting />
                      </PrivateRoute>
                    } />
                    <Route path="/" element={
                      <PrivateRoute>
                        <RootRedirect />
                      </PrivateRoute>
                    } />
                  </Routes>
                </main>
              </div>
              
              {/* Floating Chat Widget - Available on all authenticated pages */}
              <ChatWidget />
              
              <Toaster position="top-right" />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App; 