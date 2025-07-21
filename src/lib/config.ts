// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://corporate.forte.works' 
    : 'https://corporate.forte.works', // Development'ta da production API kullan
  
  endpoints: {
    verifySession: '/api/endpoints/verify_session.php',
    updateProfile: '/api/endpoints/update_profile.php',
    updateUserPhoto: '/api/endpoints/update_user_photo.php',
    getOffices: '/api/endpoints/get_offices.php',
    getDepartments: '/api/endpoints/get_departments.php',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};