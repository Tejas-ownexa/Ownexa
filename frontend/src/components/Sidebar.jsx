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
<<<<<<< HEAD
  Upload
=======
  ClipboardList,
  RefreshCw,
  Building2,
  AlertOctagon
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112
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
      { name: 'Excel Import', href: '/excel-import', icon: Upload },
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
<<<<<<< HEAD
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
            <div className="flex-1 h-0 pt-3 pb-4 overflow-y-auto">
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
=======
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
                    <button
                      onClick={item.toggle}
                      className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 ${
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
                      {!isCollapsed && (
                        item.isExpanded ? (
                          <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        )
                      )}
                    </button>

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
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112
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
<<<<<<< HEAD
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
=======
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
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112
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
      <div className={`hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:left-0 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col w-full">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-3 pb-4 overflow-y-auto">
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
