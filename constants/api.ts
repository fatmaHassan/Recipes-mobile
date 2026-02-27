/**
 * API Configuration
 * 
 * This file contains the base URL and API endpoints configuration
 * for connecting to the Laravel backend.
 */

import { Platform } from 'react-native';

// Your Mac's local IP address - UPDATE THIS to match your network
// Find it by running: ipconfig getifaddr en0
const LOCAL_IP = '192.168.178.32';

// Determine the API base URL based on environment and platform
const getApiBaseUrl = (): string => {
  // For development - adjust if your Laravel server runs on a different port
  if (__DEV__) {
    // For physical devices (iPhone/Android), use your Mac's local IP
    // For simulators/emulators, use localhost variants
    
    if (Platform.OS === 'android') {
      // Android Emulator uses 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:8000/api';
    } else if (Platform.OS === 'ios') {
      // Use local IP for physical devices - works for both simulator and device
      return `http://${LOCAL_IP}:8000/api`;
    } else {
      // Web or other platforms
      return 'http://localhost:8000/api';
    }
  }
  
  // For production - replace with your actual production API URL
  return 'https://your-domain.com/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  
  // API Endpoints
  ENDPOINTS: {
    // Authentication (Public)
    LOGIN: '/login',
    REGISTER: '/register',
    
    // Authentication (Protected - requires auth:sanctum)
    LOGOUT: '/logout',
    USER: '/user', // Get current authenticated user
    
    // Dashboard
    DASHBOARD: '/dashboard',
    
    // Ingredients
    INGREDIENTS: '/ingredients',
    INGREDIENTS_STORE: '/ingredients', // POST
    INGREDIENTS_DELETE: '/ingredients', // DELETE with ID: /ingredients/{id}
    INGREDIENTS_SEARCH: '/ingredients/search',
    INGREDIENTS_CHECK: '/ingredients/check',
    
    // Allergies
    ALLERGIES: '/allergies',
    ALLERGIES_STORE: '/allergies', // POST
    ALLERGIES_DELETE: '/allergies', // DELETE with ID: /allergies/{id}
    
    // Recipes
    RECIPES_SEARCH: '/recipes/search', // GET or POST
    RECIPES_SHOW: '/recipes', // GET with ID: /recipes/{id}
    RECIPES_SAVE: '/recipes/save',
    RECIPES_FAVORITE: '/recipes', // POST with ID: /recipes/{recipeId}/favorite
    
    // Favorites
    FAVORITES: '/favorites',
    
    // My Recipes
    MY_RECIPES: '/my-recipes',
    
    // Cuisines
    CUISINES: '/cuisines',
    CUISINES_RECIPES: '/cuisines', // GET with cuisine name: /cuisines/{cuisine}
    
    // Profile
    PROFILE: '/profile', // GET
    PROFILE_UPDATE: '/profile', // PUT
    PROFILE_DELETE: '/profile', // DELETE
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 10000,
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get full API URL with ID
export const getApiUrlWithId = (endpoint: string, id: string | number): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}/${id}`;
};

// Helper function to get recipe favorite endpoint URL
export const getRecipeFavoriteUrl = (recipeId: string | number): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECIPES_FAVORITE}/${recipeId}/favorite`;
};
