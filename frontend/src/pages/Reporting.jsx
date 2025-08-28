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
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const Reporting = () => {
  const { user } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
          <div key={index} className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm font-medium text-gray-500">{item.label}</div>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderReportData = (data) => {
    if (!data) return null;

    // Handle different report types
    if (data.properties) {
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Properties</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.properties.map((property, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{property.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.property_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        property.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(property.monthly_rent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.tenant_name}</td>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tenants</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lease End</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.tenants.map((tenant, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.property_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(tenant.monthly_rent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.lease_end}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Maintenance Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.requests.map((request, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.property_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(request.cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Report data will be displayed here after generation.</p>
      </div>
    );
  };

  if (loadingTypes) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Generate comprehensive reports for your property management data</p>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <span className="ml-2">Generate</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              disabled={!reportData || downloadPdfMutation.isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download PDF"
            >
              {downloadPdfMutation.isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
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
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {type.name}
                    </div>
                    <div className="text-sm text-gray-500">{type.description}</div>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{reportData.report_type}</h2>
                <p className="text-gray-600">
                  Generated by {reportData.generated_by} • 
                  {reportData.date_range?.start_date} to {reportData.date_range?.end_date}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Generated on</div>
                <div className="text-sm font-medium text-gray-900">
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
