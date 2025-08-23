// Frontend configuration
const config = {
  // API base URL - using direct connection instead of proxy
  API_BASE_URL: 'http://localhost:5002',
  
  // Alternative for proxy connection (currently disabled due to proxy issues)
  // API_BASE_URL: '',
  
  // App settings
  APP_NAME: 'Real Estate Management System',
  VERSION: '1.0.0',
  
  // API timeouts
  API_TIMEOUT: 10000, // 10 seconds
  
  // Local storage keys
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  
  // File upload settings
  MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

export default config; 