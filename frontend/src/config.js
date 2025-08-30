// Frontend configuration
const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001',
  UPLOAD_URL: process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5001/uploads',
  APP_NAME: 'Ownexa Real Estate Management',
  VERSION: '1.0.0'
};

export default config;
