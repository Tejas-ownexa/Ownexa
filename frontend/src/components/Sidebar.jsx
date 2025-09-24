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
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  Building2,
  AlertOctagon
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [rentalsExpanded, setRentalsExpanded] = useState(false);
  const [leasingExpanded, setLeasingExpanded] = useState(false);
  const [associationsExpanded, setAssociationsExpanded] = useState(false);
  const [maintenanceExpanded, setMaintenanceExpanded] = useState(false);

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
      {
        name: 'Associations',
        icon: Building2,
        isExpandable: true,
        isExpanded: associationsExpanded,
        toggle: () => setAssociationsExpanded(!associationsExpanded),
        subItems: [
          { name: 'Associations', href: '/associations', icon: Building2 },
          { name: 'Ownership accounts', href: '/associations/ownership-accounts', icon: CreditCard },
          { name: 'Association owners and tenants', href: '/associations/owners-tenants', icon: Users },
          { name: 'Outstanding balances', href: '/associations/outstanding-balances', icon: AlertTriangle },
          { name: 'Violations', href: '/associations/violations', icon: AlertOctagon },
          { name: 'Architectural requests', href: '/associations/architectural-requests', icon: FileText }
        ]
      },
      {
        name: 'Rentals',
        icon: Calendar,
        isExpandable: true,
        isExpanded: rentalsExpanded,
        toggle: () => setRentalsExpanded(!rentalsExpanded),
        subItems: [
          { name: 'Properties', href: '/rentals?tab=properties', icon: Building },
          { name: 'Rentroll', href: '/rent-roll', icon: Receipt },
          { name: 'Rental Owners', href: '/rental-owners', icon: UserCheck },
          { name: 'Tenants', href: '/tenants', icon: Users },
          { name: 'Outstanding Balance', href: '/outstanding-balances', icon: AlertTriangle }
        ]
      },
      {
        name: 'Leasing',
        icon: ClipboardList,
        isExpandable: true,
        isExpanded: leasingExpanded,
        toggle: () => setLeasingExpanded(!leasingExpanded),
        subItems: [
          { name: 'Listing', href: '/leasing?tab=listing', icon: Building },
          { name: 'Applicants', href: '/leasing?tab=applicants', icon: Users },
          { name: 'Draft Lease', href: '/leasing?tab=draft-lease', icon: FileText },
          { name: 'Lease Renewals', href: '/leasing?tab=lease-renewals', icon: RefreshCw }
        ]
      },
      {
        name: 'Maintenance',
        icon: Wrench,
        isExpandable: true,
        isExpanded: maintenanceExpanded,
        toggle: () => setMaintenanceExpanded(!maintenanceExpanded),
        subItems: [
          { name: 'Vendors', href: '/maintenance/vendors', icon: Users },
          { name: 'Work Orders', href: '/maintenance/work-orders', icon: ClipboardList }
        ]
      },
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
      {/* Desktop Sidebar */}
      <div className={`glass-card h-screen fixed left-0 top-0 z-50 transition-all duration-500 hidden md:flex md:flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 flex-shrink-0">
          {!isCollapsed && (
            <Link 
              to={user?.role === 'VENDOR' ? '/maintenance' : '/dashboard'} 
              className="flex items-center group"
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Home className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gradient">OWNEXA</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100/50 transition-all duration-300 hover:scale-110 hover:shadow-md"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 flex-1 overflow-y-auto pb-32">
          <div className="px-2 space-y-1">
            {navItems.map((item) => {
              if (item.isExpandable) {
                // Expandable item with sub-items
                const Icon = item.icon;
                const isActive = location.pathname === '/rentals' ||
                  item.subItems.some(subItem =>
                    location.pathname === subItem.href.split('?')[0] ||
                    location.pathname + location.search === subItem.href
                  );

                return (
                  <div key={item.name}>
                    <div className="flex items-center">
                      <Link
                        to={item.name === 'Associations' ? '/associations' : item.name === 'Rentals' ? '/rentals' : item.name === 'Leasing' ? '/leasing' : item.name === 'Maintenance' ? '/maintenance' : '#'}
                        className={`flex items-center flex-1 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-r-2 border-blue-600 shadow-md'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-blue-600 hover:shadow-sm'
                        }`}
                        title={isCollapsed ? item.name : ''}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        {!isCollapsed && (
                          <span className="ml-3 flex-1 text-left">{item.name}</span>
                        )}
                      </Link>
                      {!isCollapsed && (
                        <button
                          onClick={item.toggle}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {item.isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Sub-items */}
                    {item.isExpanded && !isCollapsed && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.href.split('?')[0] &&
                            (subItem.href.includes('tab=') ? location.search.includes(subItem.href.split('tab=')[1]) : true);

                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isSubActive
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
                              }`}
                            >
                              <SubIcon className="h-4 w-4" />
                              <span className="ml-3">{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Regular navigation item
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-r-2 border-blue-600 shadow-md'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-blue-600 hover:shadow-sm'
                    }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    {!isCollapsed && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </Link>
                );
              }
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
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
      <div className="md:hidden fixed top-2 left-2 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-md shadow-lg border border-gray-200"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileOpen(false)} />
        <div className="absolute left-0 top-0 h-full w-80 sm:w-64 bg-white shadow-lg transform transition-transform duration-300 flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <Link 
              to={user?.role === 'VENDOR' ? '/maintenance' : '/dashboard'} 
              className="flex items-center"
              onClick={() => setIsMobileOpen(false)}
            >
              <Home className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">OWNEXA</span>
            </Link>
          </div>

          {/* Mobile Navigation Items */}
          <nav className="mt-4 flex-1 overflow-y-auto pb-32">
            <div className="px-2 space-y-1">
              {navItems.map((item) => {
                if (item.isExpandable) {
                  // Expandable item with sub-items for mobile
                  const Icon = item.icon;
                  const isActive = location.pathname === '/rentals' ||
                    item.subItems.some(subItem =>
                      location.pathname === subItem.href.split('?')[0] ||
                      location.pathname + location.search === subItem.href
                    );

                  return (
                    <div key={item.name}>
                      <button
                        onClick={item.toggle}
                        className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="ml-3 flex-1 text-left">{item.name}</span>
                        {item.isExpanded ? (
                          <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                      </button>

                      {/* Mobile Sub-items */}
                      {item.isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.href.split('?')[0] &&
                              (subItem.href.includes('tab=') ? location.search.includes(subItem.href.split('tab=')[1]) : true);

                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                  isSubActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
                                }`}
                                onClick={() => setIsMobileOpen(false)}
                              >
                                <SubIcon className="h-4 w-4" />
                                <span className="ml-3">{subItem.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Regular navigation item for mobile
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
                }
              })}
            </div>
          </nav>

          {/* Mobile User Section */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
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
