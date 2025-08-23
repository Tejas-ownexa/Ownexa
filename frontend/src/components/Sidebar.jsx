import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  User, 
  LogOut, 
  Building, 
  Users, 
  Wrench, 
  DollarSign, 
  Menu, 
  X,
  Plus,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ onCollapseChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getNavItems = () => {
    if (!user) return [];
    
    if (user.role === 'TENANT') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Maintenance', href: '/maintenance', icon: Wrench },
      ];
    }
    
    if (user.role === 'VENDOR') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Maintenance', href: '/maintenance', icon: Wrench },
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

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-40 h-full bg-white shadow-xl border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-3"
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Real Estate</span>
            </Link>
          )}
          
          {/* Collapse button - Desktop only */}
          <button
            onClick={() => {
              const newCollapsedState = !isCollapsed;
              setIsCollapsed(newCollapsedState);
              if (onCollapseChange) {
                onCollapseChange(newCollapsedState);
              }
            }}
            className="hidden lg:block p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center px-3 py-3 rounded-lg transition-all duration-200
                  ${active 
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isCollapsed ? 'justify-center' : 'space-x-3'}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <Icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}

          {/* Add Property Quick Action - Only for owners */}
          {(user.role === 'OWNER' || user.role === 'AGENT') && (
            <div className="pt-4 border-t border-gray-200">
              <Link
                to="/add-property"
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center px-3 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200
                  ${isCollapsed ? 'justify-center' : 'space-x-3'}
                `}
                title={isCollapsed ? 'Add Property' : ''}
              >
                <Plus className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                {!isCollapsed && (
                  <span className="font-medium">Add Property</span>
                )}
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-gray-200 p-4">
          {!isCollapsed && (
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200
              ${isCollapsed ? 'justify-center' : 'space-x-3'}
            `}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
            {!isCollapsed && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
