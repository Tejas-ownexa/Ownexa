import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Search, 
  User, 
  LogOut, 
  Plus, 
  Heart, 
  Menu, 
  X, 
  Building, 
  Users, 
  Wrench, 
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getNavItems = () => {
    if (!user) return [];
    
    if (user.role === 'TENANT') {
      return [
        { name: 'Maintenance', href: '/maintenance', icon: Wrench },
      ];
    }
    
    if (user.role === 'VENDOR') {
      return [
        { name: 'Profile', href: '/vendor-profile', icon: User },
      ];
    }
    
    // For OWNER and AGENT roles
    return [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Properties', href: '/properties', icon: Building },
      { name: 'Tenants', href: '/tenants', icon: Users },
      { name: 'Maintenance', href: '/maintenance', icon: Wrench },
      { name: 'Financial', href: '/financial', icon: DollarSign },
    ];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`bg-white shadow-lg h-screen fixed left-0 top-0 z-50 transition-all duration-300 hidden md:block ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link 
              to={user?.role === 'VENDOR' ? '/maintenance' : '/dashboard'} 
              className="flex items-center"
            >
              <Home className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Real Estate</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4">
          <div className="px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!isCollapsed && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {!isCollapsed && (
            <div className="mb-3">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-2" />
                <div className="truncate">
                  <div className="font-medium">{user.full_name || user.username}</div>
                  <div className="text-xs text-gray-500">
                    {user.role === 'TENANT' ? '🏠 Tenant' : 
                     user.role === 'VENDOR' ? '🔧 Vendor' : '👤 Owner'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-md shadow-lg"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileOpen(false)} />
        <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link 
              to={user?.role === 'VENDOR' ? '/maintenance' : '/dashboard'} 
              className="flex items-center"
              onClick={() => setIsMobileOpen(false)}
            >
              <Home className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Real Estate</span>
            </Link>
          </div>

          {/* Mobile Navigation Items */}
          <nav className="mt-4">
            <div className="px-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Mobile User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="mb-3">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">{user.full_name || user.username}</div>
                  <div className="text-xs text-gray-500">
                    {user.role === 'TENANT' ? '🏠 Tenant' : 
                     user.role === 'VENDOR' ? '🔧 Vendor' : '👤 Owner'}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout();
                setIsMobileOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 
