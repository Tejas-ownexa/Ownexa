import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardRouter from './pages/DashboardRouter';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import AddProperty from './pages/AddProperty';
import Tenants from './pages/Tenants';
import MaintenanceRequests from './pages/MaintenanceRequests';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import MaintenanceRequest from './pages/MaintenanceRequest';
import VendorProfile from './pages/VendorProfile';
import Financial from './pages/Financial';
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <DashboardRouter />
                  </PrivateRoute>
                } />
                <Route path="/properties" element={
                  <PrivateRoute>
                    <Properties />
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
                <Route path="/financial" element={
                  <PrivateRoute>
                    <Financial />
                  </PrivateRoute>
                } />
                <Route path="/" element={
                  <PrivateRoute>
                    <RootRedirect />
                  </PrivateRoute>
                } />
              </Routes>
            </main>
            
            {/* Floating Chat Widget - Available on all authenticated pages */}
            <ChatWidget />
            
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App; 