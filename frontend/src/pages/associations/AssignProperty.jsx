import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Home, DollarSign, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import associationService from '../../services/associationService';

const currencyOrEmpty = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return num;
};

export default function AssignProperty() {
  const { id: associationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [hoaFees, setHoaFees] = useState('');
  const [specialAssessment, setSpecialAssessment] = useState('');
  const [ship1, setShip1] = useState('');
  const [ship2, setShip2] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipState, setShipState] = useState('');
  const [shipZip, setShipZip] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: association } = useQuery(['association', associationId], () => associationService.getAssociation(associationId));

  const { data: availableProperties = [], isLoading } = useQuery(
    ['association-available-properties', associationId],
    () => associationService.getAvailableProperties(associationId),
    { refetchOnWindowFocus: false }
  );

  // Filter properties based on search term
  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) return availableProperties;
    
    const term = searchTerm.toLowerCase();
    return availableProperties.filter(property => 
      property.title.toLowerCase().includes(term) ||
      property.address?.street_1?.toLowerCase().includes(term) ||
      property.address?.city?.toLowerCase().includes(term) ||
      property.address?.state?.toLowerCase().includes(term) ||
      property.address?.zip?.includes(term)
    );
  }, [availableProperties, searchTerm]);

  const assignMutation = useMutation(
    (payload) => associationService.assignProperty(associationId, payload),
    {
      onSuccess: () => {
        toast.success('Property assigned successfully');
        queryClient.invalidateQueries(['association', associationId]);
        navigate(`/associations/${associationId}`);
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to assign property');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast.error('Select a property');
      return;
    }
    assignMutation.mutate({
      property_id: selectedPropertyId,
      hoa_fees: currencyOrEmpty(hoaFees),
      special_assessment: currencyOrEmpty(specialAssessment),
      ship_street_address_1: ship1,
      ship_street_address_2: ship2,
      ship_city: shipCity,
      ship_state: shipState,
      ship_zip_code: shipZip,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-md">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Assign Property{association ? ` to ${association.name}` : ''}</h1>
          <div />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Property</label>
          
          {/* Search Bar */}
          {availableProperties.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search properties by name, address, city, state, or ZIP..."
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && (
                <p className="mt-1 text-sm text-gray-600">
                  Showing {filteredProperties.length} of {availableProperties.length} properties
                </p>
              )}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-500">Loading properties...</span>
            </div>
          ) : availableProperties.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No unassigned properties available.</p>
              <p className="text-sm text-gray-400 mt-1">All your properties are already assigned to associations.</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No properties match your search.</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {filteredProperties.map((p) => (
                <label key={p.id} className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-200">
                  <input
                    type="radio"
                    name="property"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={selectedPropertyId === p.id}
                    onChange={() => setSelectedPropertyId(p.id)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                      <Home className="h-4 w-4 text-blue-600" /> 
                      {p.title}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>
                        {p.address?.street_1}
                        {p.address?.street_2 && `, ${p.address.street_2}`}
                        {p.address?.apt && `, Apt ${p.address.apt}`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {p.address?.city}, {p.address?.state} {p.address?.zip}
                    </div>
                    {p.rent_amount && (
                      <div className="text-sm font-medium text-green-600 mt-1">
                        ${p.rent_amount.toLocaleString()}/month
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Association Fees</h3>
            <span className="text-sm text-gray-500">(optional)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">HOA Fees</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <DollarSign className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={hoaFees}
                  onChange={(e) => setHoaFees(e.target.value)}
                  className="block w-full pl-9 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Monthly HOA fees for this property</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Assessment</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <DollarSign className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={specialAssessment}
                  onChange={(e) => setSpecialAssessment(e.target.value)}
                  className="block w-full pl-9 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">One-time special assessment amount</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Shipping Address for Payments</h3>
            <span className="text-sm text-gray-500">(optional)</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 1</label>
              <input 
                type="text"
                value={ship1} 
                onChange={(e) => setShip1(e.target.value)} 
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter street address" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 2</label>
              <input 
                type="text"
                value={ship2} 
                onChange={(e) => setShip2(e.target.value)} 
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Apartment, suite, unit, etc. (optional)" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input 
                  type="text"
                  value={shipCity} 
                  onChange={(e) => setShipCity(e.target.value)} 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="City" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input 
                  type="text"
                  value={shipState} 
                  onChange={(e) => setShipState(e.target.value)} 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="State" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input 
                  type="text"
                  value={shipZip} 
                  onChange={(e) => setShipZip(e.target.value)} 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="ZIP Code" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!selectedPropertyId || assignMutation.isLoading} 
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {assignMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Home className="h-4 w-4" />
                  Assign Property
                </>
              )}
            </button>
          </div>
          {!selectedPropertyId && (
            <p className="text-sm text-red-600 mt-2 text-center sm:text-right">
              Please select a property to continue
            </p>
          )}
          {filteredProperties.length === 0 && availableProperties.length > 0 && (
            <p className="text-sm text-amber-600 mt-2 text-center sm:text-right">
              No properties match your search criteria
            </p>
          )}
        </div>
      </form>
    </div>
  );
}


