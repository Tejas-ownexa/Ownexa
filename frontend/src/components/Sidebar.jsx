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
  ChevronRight,
  Calendar,
  FileText,
  BookOpen,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Receipt,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [rentalsExpanded, setRentalsExpanded] = useState(false);

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
      {
        name: 'Rentals',
        icon: Calendar,
        isExpandable: true,
        isExpanded: rentalsExpanded,
        toggle: () => setRentalsExpanded(!rentalsExpanded),
        subItems: [
          { name: 'Rentroll', href: '/rentals?tab=payments', icon: Receipt },
          { name: 'Rental Owners', href: '/rentals?tab=leases', icon: UserCheck },
          { name: 'Tenants', href: '/tenants', icon: Users },
          { name: 'Outstanding Balance', href: '/rentals?tab=balances', icon: AlertTriangle }
        ]
      },
      { name: 'Maintenance', href: '/maintenance', icon: Wrench },
      { name: 'Accountability', href: '/accountability', icon: BookOpen },
      { name: 'Reports', href: '/reports', icon: FileText },
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
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-lg border border-gray-200"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Property Manager</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.isExpandable ? (
                      <div>
                        <button
                          onClick={item.toggle}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                            location.pathname.startsWith(item.href || '') || item.isExpanded
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                          {item.isExpanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
                        </button>
                        {item.isExpanded && (
                          <div className="ml-4 space-y-1">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                  location.pathname === subItem.href
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                onClick={() => setIsMobileOpen(false)}
                              >
                                <subItem.icon className="mr-3 h-4 w-4" />
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          location.pathname === item.href
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div>
                  <div className="text-sm font-medium text-gray-700">{user.full_name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-shrink-0 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col w-full">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                {!isCollapsed && <h1 className="text-xl font-bold text-gray-900">Property Manager</h1>}
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.isExpandable ? (
                      <div>
                        <button
                          onClick={item.toggle}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                            location.pathname.startsWith(item.href || '') || item.isExpanded
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {!isCollapsed && item.name}
                          {!isCollapsed && (item.isExpanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
                        </button>
                        {item.isExpanded && !isCollapsed && (
                          <div className="ml-4 space-y-1">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                  location.pathname === subItem.href
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                <subItem.icon className="mr-3 h-4 w-4" />
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          location.pathname === item.href
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {!isCollapsed && item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                {!isCollapsed && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">{user.full_name}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className={`${!isCollapsed ? 'ml-auto' : 'mx-auto'} flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  title={isCollapsed ? 'Logout' : undefined}
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapse button */}
      <div className="hidden lg:block fixed left-0 top-1/2 transform -translate-y-1/2 z-10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-white border border-gray-200 rounded-r-md p-2 shadow-lg hover:bg-gray-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </>
  );
};

export default Sidebar;
