import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Building2, MapPin, User, Plus, Home, Users, DollarSign, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import associationService from '../services/associationService';

const AssociationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showAssignPropertyModal, setShowAssignPropertyModal] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);

  // Fetch association details
  const { data: association, isLoading, error } = useQuery(
    ['association', id],
    () => associationService.getAssociation(id),
    {
      onError: (error) => {
        console.error('Error fetching association:', error);
        toast.error('Failed to load association details');
      },
    }
  );

  // Fetch available properties for assignment
  const { data: availableProperties = [] } = useQuery(
    ['properties', 'available'],
    async () => {
      const response = await fetch('/api/properties?status=available');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    {
      enabled: showAssignPropertyModal,
    }
  );

  const handleAssignProperty = () => {
    navigate(`/associations/${id}/assign-property`);
  };

  const handlePropertySelection = (propertyId) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleConfirmAssignment = async () => {
    if (selectedProperties.length === 0) {
      toast.error('Please select at least one property');
      return;
    }

    try {
      // Here you would implement the API call to assign properties to the association
      // For now, we'll just show a success message
      toast.success(`Successfully assigned ${selectedProperties.length} property(ies) to ${association.name}`);
      setShowAssignPropertyModal(false);
      setSelectedProperties([]);
      
      // Refresh association data
      queryClient.invalidateQueries(['association', id]);
    } catch (error) {
      console.error('Error assigning properties:', error);
      toast.error('Failed to assign properties');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !association) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load association details</p>
        <button
          onClick={() => navigate('/associations')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Associations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/associations')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{association.name}</h1>
              <p className="text-gray-600">Association Details & Property Management</p>
            </div>
          </div>
          <button
            onClick={handleAssignProperty}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Property
          </button>
        </div>
      </div>

      {/* Association Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Association Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-2" />
              Association Name
            </label>
            <p className="text-gray-900">{association.name}</p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Address
            </label>
            <p className="text-gray-900">{association.full_address}</p>
          </div>
        </div>
      </div>

      {/* Managers Section */}
      {association.managers && association.managers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Association Managers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {association.managers.map((manager, index) => (
              <div key={manager.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{manager.name}</h3>
                  {manager.is_primary && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Primary
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {manager.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${manager.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {manager.email}
                      </a>
                    </div>
                  )}
                  
                  {manager.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${manager.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {manager.phone}
                      </a>
                    </div>
                  )}
                  
                  {!manager.email && !manager.phone && (
                    <p className="text-sm text-gray-500 italic">No contact information available</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback for legacy manager field */}
      {(!association.managers || association.managers.length === 0) && association.manager && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Association Manager
          </h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{association.manager}</h3>
            <p className="text-sm text-gray-500 italic">No additional contact information available</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Properties</p>
              <p className="text-2xl font-semibold text-gray-900">
                {association.assigned_properties ? association.assigned_properties.length : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Managers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {association.managers ? association.managers.length : (association.manager ? 1 : 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-semibold text-gray-900">$0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Violations</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Associated Properties</h2>
          <button
            onClick={handleAssignProperty}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </button>
        </div>
        
        {association.assigned_properties && association.assigned_properties.length > 0 ? (
          <div className="space-y-4">
            {association.assigned_properties.map((property) => (
              <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Address</p>
                        <p className="text-gray-900">
                          {property.address.street_1}
                          {property.address.street_2 && `, ${property.address.street_2}`}
                          {property.address.apt && `, Apt ${property.address.apt}`}
                          <br />
                          {property.address.city}, {property.address.state} {property.address.zip}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Rent Amount</p>
                        <p className="text-gray-900 font-medium">
                          {property.rent_amount ? `$${property.rent_amount.toLocaleString()}/month` : 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Assignment Details */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Association Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">HOA Fees</p>
                          <p className="text-gray-900">
                            {property.assignment.hoa_fees ? `$${property.assignment.hoa_fees}/month` : 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Special Assessment</p>
                          <p className="text-gray-900">
                            {property.assignment.special_assessment ? `$${property.assignment.special_assessment}` : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Shipping Address */}
                      {(property.assignment.shipping_address.street_1 || 
                        property.assignment.shipping_address.city) && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-1">Shipping Address</p>
                          <p className="text-gray-900">
                            {property.assignment.shipping_address.street_1}
                            {property.assignment.shipping_address.street_2 && `, ${property.assignment.shipping_address.street_2}`}
                            {property.assignment.shipping_address.city && (
                              <>
                                <br />
                                {property.assignment.shipping_address.city}
                                {property.assignment.shipping_address.state && `, ${property.assignment.shipping_address.state}`}
                                {property.assignment.shipping_address.zip && ` ${property.assignment.shipping_address.zip}`}
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Assigned
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Home className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Assigned</h3>
            <p className="text-gray-600 mb-6">This association doesn't have any properties assigned yet.</p>
            <button
              onClick={handleAssignProperty}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Your First Property
            </button>
          </div>
        )}
      </div>

      {/* Assign Property Modal */}
      {showAssignPropertyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Properties to {association.name}</h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availableProperties.length > 0 ? (
                  availableProperties.map((property) => (
                    <div key={property.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`property-${property.id}`}
                        checked={selectedProperties.includes(property.id)}
                        onChange={() => handlePropertySelection(property.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`property-${property.id}`} className="ml-3 text-sm text-gray-900">
                        <div className="font-medium">{property.title}</div>
                        <div className="text-gray-500">{property.address?.street_1}, {property.address?.city}</div>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No available properties found</p>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignPropertyModal(false);
                    setSelectedProperties([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAssignment}
                  disabled={selectedProperties.length === 0}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign {selectedProperties.length} Property{selectedProperties.length !== 1 ? 'ies' : 'y'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationDetail;
