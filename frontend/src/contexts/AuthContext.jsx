import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      console.log('🔍 AuthContext: fetchUser called');
      console.log('🔍 AuthContext: Making API call to /api/auth/me');
      const response = await api.get('/api/auth/me');
      console.log('🔍 AuthContext: API response received:', response);
      
      // Ensure the user object only contains expected properties
      const userData = response.data;
      console.log('🔍 AuthContext: Raw user data:', userData);
      
      if (userData && typeof userData === 'object') {
        // Map the new User model fields to frontend expectations
        const safeUserData = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          full_name: userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : 'Unknown',
          phone: userData.phone_number,
          role: userData.role,
          is_agent: userData.role === 'AGENT',
          is_owner: userData.role === 'OWNER',
          is_tenant: userData.role === 'TENANT',
          is_admin: userData.role === 'OWNER' || userData.role === 'AGENT',
          street_address_1: userData.street_address_1,
          street_address_2: userData.street_address_2,
          apt_number: userData.apt_number,
          city: userData.city,
          state: userData.state,
          zip_code: userData.zip_code,
          is_active: userData.is_active,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        };
        console.log('🔍 AuthContext: Safe user data:', safeUserData);
        setUser(safeUserData);
        // Store user data in localStorage for redirection purposes
        localStorage.setItem('user', JSON.stringify(safeUserData));
        console.log('🔍 AuthContext: User state updated');
      } else {
        console.log('❌ AuthContext: Invalid user data, setting user to null');
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('🔍 AuthContext: Login attempt with username:', username);
      // Send data as URL-encoded form data, not FormData
      // Send credentials as JSON instead of form data
      console.log('🔍 AuthContext: Making API call to /api/auth/token');
      const response = await api.post('/api/auth/token', {
        username,
        password
      });
      console.log('🔍 AuthContext: API response received:', response);
      const { access_token } = response.data;
      console.log('🔍 AuthContext: Access token received:', access_token ? 'Yes' : 'No');

      localStorage.setItem('token', access_token);
      console.log('🔍 AuthContext: Token stored in localStorage');

      console.log('🔍 AuthContext: Fetching user data...');
      await fetchUser();
      toast.success('Login successful!');
      console.log('🔍 AuthContext: Login completed successfully');
      return { success: true, user: JSON.parse(localStorage.getItem('user') || '{}') };
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        // Handle validation errors (Pydantic errors)
        if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
          // Multiple validation errors
          errorMessage = error.response.data.detail.map(err => err.msg).join(', ');
        } else if (error.response.data.detail && typeof error.response.data.detail === 'string') {
          // Single string error
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail && typeof error.response.data.detail === 'object') {
          // Object error (like validation errors)
          if (error.response.data.detail.msg) {
            errorMessage = error.response.data.detail.msg;
          } else {
            errorMessage = 'Validation error occurred';
          }
        }
      }
      
      toast.error(errorMessage);
      return { success: false, user: null };
    }
  };

  const register = async (userData) => {
    try {
      console.log('🔍 AuthContext: Registration attempt with data:', userData);
      console.log('🔍 AuthContext: Making API call to /api/auth/register');
      
      const response = await api.post('/api/auth/register', userData);
      
      console.log('🔍 AuthContext: Registration successful:', response.data);
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error) {
      console.error('🔍 AuthContext: Registration error:', error);
      console.error('🔍 AuthContext: Error response:', error.response);
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        // Handle validation errors (Pydantic errors)
        if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
          // Multiple validation errors
          errorMessage = error.response.data.detail.map(err => err.msg).join(', ');
        } else if (error.response.data.detail && typeof error.response.data.detail === 'string') {
          // Single string error
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail && typeof error.response.data.detail === 'object') {
          // Object error (like validation errors)
          if (error.response.data.detail.msg) {
            errorMessage = error.response.data.detail.msg;
          } else {
            errorMessage = 'Validation error occurred';
          }
        }
      }
      
      console.error('🔍 AuthContext: Final error message:', errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    // Role helper functions
    is_owner: user?.role === 'OWNER',
    is_agent: user?.role === 'AGENT',
    is_tenant: user?.role === 'TENANT',
    is_admin: user?.role === 'OWNER' || user?.role === 'AGENT',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 