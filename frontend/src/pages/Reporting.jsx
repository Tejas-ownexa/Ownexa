import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Building, 
  Users, 
  Wrench, 
  DollarSign,
  Home,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  PieChart,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Reporting = () => {
  const { user } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Interactive features state
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    tenants: true,
    maintenance: true,
    financial: true,
    overview: true
  });
  const [searchFilters, setSearchFilters] = useState({
    properties: '',
    tenants: '',
    maintenance: '',
    financial: ''
  });
  const [sortConfig, setSortConfig] = useState({
    properties: { key: null, direction: 'asc' },
    tenants: { key: null, direction: 'asc' },
    maintenance: { key: null, direction: 'asc' },
    financial: { key: null, direction: 'asc' }
  });
  const [showCharts, setShowCharts] = useState(true);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Fetch available report types
  const { data: reportTypesData, isLoading: loadingTypes } = useQuery(
    'reportTypes',
    async () => {
      const response = await api.get('/api/reports/types');
      return response.data;
    },
    {
      enabled: !!user,
      onError: (error) => {
        toast.error('Failed to load report types');
        console.error('Error loading report types:', error);
      }
    }
  );

  // Generate report mutation
  const generateReportMutation = useMutation(
    async ({ reportType, startDate, endDate, format }) => {
      const response = await api.post('/api/reports/generate', {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        format: format
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setReportData(data);
        setIsGenerating(false);
        toast.success('Report generated successfully!');
      },
      onError: (error) => {
        setIsGenerating(false);
        toast.error('Failed to generate report');
        console.error('Error generating report:', error);
      }
    }
  );

  // Download PDF mutation
  const downloadPdfMutation = useMutation(
    async ({ reportType, startDate, endDate }) => {
      const response = await api.post('/api/reports/generate', {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        format: 'pdf'
      }, {
        responseType: 'blob'
      });
      return response.data;
    },
    {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReportType}_${startDate}_${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF downloaded successfully!');
      },
      onError: (error) => {
        toast.error('Failed to download PDF');
        console.error('Error downloading PDF:', error);
      }
    }
  );

  const handleGenerateReport = () => {
    if (!selectedReportType) {
      toast.error('Please select a report type');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setIsGenerating(true);
    generateReportMutation.mutate({
      reportType: selectedReportType,
      startDate,
      endDate,
      format: 'json'
    });
  };

  const handleDownloadPDF = () => {
    if (!selectedReportType) {
      toast.error('Please select a report type');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    downloadPdfMutation.mutate({
      reportType: selectedReportType,
      startDate,
      endDate
    });
  };

  const getReportIcon = (reportType) => {
    const icons = {
      property_summary: Building,
      tenant_report: Users,
      maintenance_report: Wrench,
      financial_report: DollarSign,
      rental_report: TrendingUp,
      vendor_report: Briefcase,
      association_report: MapPin,
      comprehensive_report: FileText
    };
    return icons[reportType] || FileText;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  // Interactive helper functions
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSearch = (section, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const handleSort = (section, key) => {
    setSortConfig(prev => {
      const current = prev[section];
      const direction = current.key === key && current.direction === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        [section]: { key, direction }
      };
    });
  };

  const filterAndSortData = (data, section, searchKey = 'title') => {
    if (!data) return [];
    
    let filtered = data;
    
    // Apply search filter
    if (searchFilters[section]) {
      filtered = data.filter(item => 
        item[searchKey]?.toLowerCase().includes(searchFilters[section].toLowerCase()) ||
        item.full_name?.toLowerCase().includes(searchFilters[section].toLowerCase()) ||
        item.property_title?.toLowerCase().includes(searchFilters[section].toLowerCase())
      );
    }
    
    // Apply sorting
    const sort = sortConfig[section];
    if (sort.key) {
      filtered.sort((a, b) => {
        const aVal = a[sort.key];
        const bVal = b[sort.key];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.direction === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }
    
    return filtered;
  };

  const getSortIcon = (section, key) => {
    const sort = sortConfig[section];
    if (sort.key !== key) return <SortAsc className="h-4 w-4 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />;
    return sort.direction === 'asc' 
      ? <SortAsc className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      : <SortDesc className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
  };

  // Chart and analytics components
  const renderAnalyticsWidgets = (data) => {
    if (!data || !data.overview) return null;

    const overview = data.overview;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Occupancy Rate Widget */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Occupancy Rate</p>
              <p className="text-xl font-bold">{overview.occupancy_rate || 0}%</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-2">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="bg-blue-400 bg-opacity-30 rounded-full h-1.5">
              <div 
                className="bg-white dark:bg-gray-800 rounded-full h-1.5 transition-all duration-1000 ease-out"
                style={{ width: `${overview.occupancy_rate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Properties Widget */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">Total Properties</p>
              <p className="text-xl font-bold">{overview.total_properties || 0}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-2">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-green-100 text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Active Portfolio</span>
          </div>
        </div>

        {/* Net Income Widget */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Net Income</p>
              <p className="text-xl font-bold">{formatCurrency(overview.net_income || 0)}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-2">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-purple-100 text-xs">
            <Target className="h-3 w-3 mr-1" />
            <span>Monthly Performance</span>
          </div>
        </div>

        {/* Maintenance Requests Widget */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Maintenance</p>
              <p className="text-xl font-bold">{overview.total_maintenance_requests || 0}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-2">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-orange-100 text-xs">
            <Activity className="h-3 w-3 mr-1" />
            <span>Active Requests</span>
          </div>
        </div>
      </div>
    );
  };

  const renderInteractiveChart = (data) => {
    if (!data || !data.overview) return null;

    const overview = data.overview;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
            <PieChart className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            Portfolio Overview
          </h3>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white"
          >
            {showCharts ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
        </div>
        
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Income vs Expenses Chart */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Income vs Expenses</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Total Income</span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">{formatCurrency(overview.total_income || 0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Total Expenses</span>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">{formatCurrency(overview.total_expenses || 0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: overview.total_income > 0 
                        ? `${(overview.total_expenses / overview.total_income) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Property Status Chart */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Property Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Occupied</span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{overview.total_properties - (overview.total_properties - (overview.total_tenants || 0))}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: overview.total_properties > 0 
                        ? `${((overview.total_tenants || 0) / overview.total_properties) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Vacant</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{overview.total_properties - (overview.total_tenants || 0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gray-50 dark:bg-gray-9000 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: overview.total_properties > 0 
                        ? `${((overview.total_properties - (overview.total_tenants || 0)) / overview.total_properties) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportSummary = (data) => {
    if (!data || !data.summary) return null;

    const summary = data.summary;
    const items = Object.entries(summary).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof value === 'number' && key.includes('rate') ? formatPercentage(value) :
             typeof value === 'number' && (key.includes('cost') || key.includes('rent') || key.includes('income') || key.includes('expense') || key.includes('value')) ? formatCurrency(value) :
             typeof value === 'number' ? value.toLocaleString() : value
    }));

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {items.map((item, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{item.label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderReportData = (data) => {
    if (!data) return null;
    
    // Debug: Log the data structure to help with troubleshooting
    console.log('Report data structure:', data);
    console.log('Report data keys:', Object.keys(data));

    // Handle different report types
    if (data.properties) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Properties</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monthly Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tenant</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {data.properties.map((property, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{property.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{property.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{property.property_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        property.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(property.monthly_rent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{property.tenant_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (data.tenants) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tenants</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monthly Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lease End</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {data.tenants.map((tenant, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tenant.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{tenant.property_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(tenant.monthly_rent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{tenant.lease_end}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (data.requests) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Maintenance Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {data.requests.map((request, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{request.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{request.property_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                        request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:text-yellow-200' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                        request.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(request.cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{request.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Handle comprehensive report with sections
    if (data.sections) {
      return (
        <div className="space-y-4">
          {/* Analytics Widgets */}
          {renderAnalyticsWidgets(data)}
          
          {/* Interactive Charts */}
          {renderInteractiveChart(data)}

          {/* Properties Section */}
          {data.sections.properties && data.sections.properties.properties && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection('properties')}
                    className="flex items-center text-lg font-bold text-blue-800 dark:text-blue-200 hover:text-blue-900 transition-colors"
                  >
                    <Building className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                    Properties Portfolio
                    <span className="ml-3 text-sm font-normal text-blue-600 dark:text-blue-400">
                      ({data.sections.properties.properties.length} properties)
                    </span>
                    {expandedSections.properties ? (
                      <ChevronUp className="h-5 w-5 ml-3" />
                    ) : (
                      <ChevronDown className="h-5 w-5 ml-3" />
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchFilters.properties}
                        onChange={(e) => handleSearch('properties', e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedSections.properties && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600">
                      <tr>
                        <th 
                          className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort('properties', 'title')}
                        >
                          <div className="flex items-center">
                            Property Name
                            {getSortIcon('properties', 'title')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Address</th>
                        <th 
                          className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort('properties', 'status')}
                        >
                          <div className="flex items-center justify-center">
                            Status
                            {getSortIcon('properties', 'status')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
                          onClick={() => handleSort('properties', 'monthly_rent')}
                        >
                          <div className="flex items-center justify-end">
                            Monthly Rent
                            {getSortIcon('properties', 'monthly_rent')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Tenant</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {filterAndSortData(data.sections.properties.properties, 'properties', 'title').map((property, index) => (
                        <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{property.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{property.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                              property.status?.toLowerCase() === 'occupied' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200' 
                                : property.status?.toLowerCase() === 'available'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                            }`}>
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                property.status?.toLowerCase() === 'occupied' 
                                  ? 'bg-green-500' 
                                  : property.status?.toLowerCase() === 'available'
                                  ? 'bg-orange-500'
                                  : 'bg-gray-50 dark:bg-gray-9000'
                              }`}></span>
                              {property.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium text-right">{formatCurrency(property.monthly_rent)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{property.tenant_name || 'Vacant'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tenants Section */}
          {data.sections.tenants && data.sections.tenants.tenants && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b-2 border-green-600 bg-green-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection('tenants')}
                    className="flex items-center text-lg font-bold text-green-800 dark:text-green-200 hover:text-green-900 transition-colors"
                  >
                    <Users className="h-5 w-5 mr-3 text-green-600 dark:text-green-400" />
                    Tenants Management
                    <span className="ml-3 text-sm font-normal text-green-600 dark:text-green-400">
                      ({data.sections.tenants.tenants.length} tenants)
                    </span>
                    {expandedSections.tenants ? (
                      <ChevronUp className="h-5 w-5 ml-3" />
                    ) : (
                      <ChevronDown className="h-5 w-5 ml-3" />
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
                      <input
                        type="text"
                        placeholder="Search tenants..."
                        value={searchFilters.tenants}
                        onChange={(e) => handleSearch('tenants', e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedSections.tenants && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-green-600">
                      <tr>
                        <th 
                          className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-green-700"
                          onClick={() => handleSort('tenants', 'full_name')}
                        >
                          <div className="flex items-center">
                            Name
                            {getSortIcon('tenants', 'full_name')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Property</th>
                        <th 
                          className="px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-green-700"
                          onClick={() => handleSort('tenants', 'monthly_rent')}
                        >
                          <div className="flex items-center justify-end">
                            Monthly Rent
                            {getSortIcon('tenants', 'monthly_rent')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">Lease End</th>
                        <th 
                          className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-green-700"
                          onClick={() => handleSort('tenants', 'is_active')}
                        >
                          <div className="flex items-center justify-center">
                            Status
                            {getSortIcon('tenants', 'is_active')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {filterAndSortData(data.sections.tenants.tenants, 'tenants', 'full_name').map((tenant, index) => (
                        <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-green-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tenant.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{tenant.property_title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium text-right">{formatCurrency(tenant.monthly_rent)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 text-center">{tenant.lease_end}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                              tenant.is_active 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200'
                            }`}>
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                tenant.is_active ? 'bg-green-500' : 'bg-red-500'
                              }`}></span>
                              {tenant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Section */}
          {data.sections.maintenance && data.sections.maintenance.requests && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection('maintenance')}
                    className="flex items-center text-base font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:text-orange-400 transition-colors"
                  >
                    <Wrench className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                    Maintenance Requests
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">
                      ({data.sections.maintenance.requests.length} requests)
                    </span>
                    {expandedSections.maintenance ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
                      <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchFilters.maintenance}
                        onChange={(e) => handleSearch('maintenance', e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedSections.maintenance && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                          onClick={() => handleSort('maintenance', 'title')}
                        >
                          <div className="flex items-center">
                            Title
                            {getSortIcon('maintenance', 'title')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Property</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                          onClick={() => handleSort('maintenance', 'priority')}
                        >
                          <div className="flex items-center">
                            Priority
                            {getSortIcon('maintenance', 'priority')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                          onClick={() => handleSort('maintenance', 'status')}
                        >
                          <div className="flex items-center">
                            Status
                            {getSortIcon('maintenance', 'status')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                          onClick={() => handleSort('maintenance', 'cost')}
                        >
                          <div className="flex items-center">
                            Cost
                            {getSortIcon('maintenance', 'cost')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {filterAndSortData(data.sections.maintenance.requests, 'maintenance', 'title').map((request, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{request.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{request.property_title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                              request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:text-yellow-200' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            }`}>
                              {request.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                              request.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{formatCurrency(request.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Financial Section */}
          {data.sections.financial && data.sections.financial.transactions && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection('financial')}
                    className="flex items-center text-base font-semibold text-gray-900 dark:text-white hover:text-purple-600 transition-colors"
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
                    Financial Transactions
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">
                      ({data.sections.financial.transactions.length} transactions)
                    </span>
                    {expandedSections.financial ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchFilters.financial}
                        onChange={(e) => handleSearch('financial', e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedSections.financial && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                          onClick={() => handleSort('financial', 'type')}
                        >
                          <div className="flex items-center">
                            Type
                            {getSortIcon('financial', 'type')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                          onClick={() => handleSort('financial', 'amount')}
                        >
                          <div className="flex items-center">
                            Amount
                            {getSortIcon('financial', 'amount')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                          onClick={() => handleSort('financial', 'date')}
                        >
                          <div className="flex items-center">
                            Date
                            {getSortIcon('financial', 'date')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Property</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {filterAndSortData(data.sections.financial.transactions, 'financial', 'description').map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'INCOME' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{formatCurrency(transaction.amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{transaction.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{transaction.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{transaction.property_title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">Report data will be displayed here after generation.</p>
      </div>
    );
  };

  if (loadingTypes) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Generate comprehensive reports for your property management data</p>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Generate Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Type</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a report type</option>
              {reportTypesData?.report_types?.map((type) => {
                const Icon = getReportIcon(type.id);
                return (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-end space-x-2">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !selectedReportType}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              <span className="ml-2">Generate (View Online)</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              disabled={!reportData || downloadPdfMutation.isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Professional PDF Report"
            >
              {downloadPdfMutation.isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-2">Download PDF</span>
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Report Viewing Options</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>Generate (View Online):</strong> View the report with modern styling, interactive tables, and responsive design in your browser.</p>
                <p><strong>Download PDF:</strong> Download a professional PDF report with formatted tables, proper styling, and print-ready layout.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypesData?.report_types?.map((type) => {
            const Icon = getReportIcon(type.id);
            const isSelected = selectedReportType === type.id;
            
            return (
              <div
                key={type.id}
                onClick={() => setSelectedReportType(type.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300'}`} />
                  <div>
                    <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900 dark:text-white'}`}>
                      {type.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">{type.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{reportData.report_type}</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Generated by {reportData.generated_by} • 
                  {reportData.date_range?.start_date} to {reportData.date_range?.end_date}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">Generated on</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Report Summary */}
          {renderReportSummary(reportData)}

          {/* Report Data */}
          {renderReportData(reportData)}
        </div>
      )}
    </div>
  );
};

export default Reporting;
