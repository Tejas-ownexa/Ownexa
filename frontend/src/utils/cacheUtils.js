/**
 * Utility functions for React Query cache management
 */

/**
 * Invalidates all property-related queries to ensure data consistency
 * across the application when properties are created, updated, or deleted.
 * 
 * @param {Object} queryClient - React Query client instance
 */
export const invalidatePropertyCaches = (queryClient) => {
  // Core property queries
  queryClient.invalidateQueries(['properties']); // Properties list with filters
  queryClient.invalidateQueries(['user-properties']); // User's properties
  queryClient.invalidateQueries(['properties', 'available']); // Available properties
  queryClient.invalidateQueries(['properties', 'rented']); // Rented properties
  queryClient.invalidateQueries(['available-properties']); // Available properties for leasing
  
  // Related data that includes property information
  queryClient.invalidateQueries(['tenants']); // Tenants (they reference property data)
  queryClient.invalidateQueries(['rent-roll']); // Rent roll (includes property info)
  queryClient.invalidateQueries(['dashboard-stats']); // Dashboard statistics
  queryClient.invalidateQueries(['tenant-statistics']); // Tenant statistics
  queryClient.invalidateQueries(['financial-data']); // Financial data
  queryClient.invalidateQueries(['user-favorites']); // User's favorite properties
  
  // Maintenance and association related queries that might include property data
  queryClient.invalidateQueries(['maintenance-requests']); // Maintenance requests
  queryClient.invalidateQueries(['association']); // Association data
};

/**
 * Invalidates a specific property query along with all related caches
 * 
 * @param {Object} queryClient - React Query client instance
 * @param {string|number} propertyId - The property ID
 */
export const invalidatePropertyAndRelatedCaches = (queryClient, propertyId) => {
  // Invalidate the specific property
  queryClient.invalidateQueries(['property', propertyId]);
  
  // Invalidate all related caches
  invalidatePropertyCaches(queryClient);
};

/**
 * Invalidates tenant-related queries when tenant data is updated
 * 
 * @param {Object} queryClient - React Query client instance
 */
export const invalidateTenantCaches = (queryClient) => {
  queryClient.invalidateQueries(['tenants']);
  queryClient.invalidateQueries(['available-tenants']);
  queryClient.invalidateQueries(['tenant-statistics']);
  queryClient.invalidateQueries(['rent-roll']);
  queryClient.invalidateQueries(['dashboard-stats']);
  queryClient.invalidateQueries(['financial-data']);
  queryClient.invalidateQueries(['properties']); // In case tenant changes affect property status
  queryClient.invalidateQueries(['user-properties']); // In case tenant changes affect property status
};
