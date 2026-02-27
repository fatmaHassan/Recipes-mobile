/**
 * Authentication Service
 * 
 * Handles user authentication: login, register, logout, and token management
 */

import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';
import { API_CONFIG } from '@/constants/api';

export interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  token?: string;
  access_token?: string;
  user?: User;
  message?: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

class AuthService {
  /**
   * Store authentication token securely
   */
  private async storeToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      // Update API service with the token
      apiService.setAuthToken(token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Get stored authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Store user data
   */
  private async storeUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  /**
   * Get stored user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const response = await apiService.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.LOGIN,
        credentials
      );

      // Handle different response formats
      const token = response.token || response.access_token;
      const user = response.user;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Store token and user data
      await this.storeToken(token);
      if (user) {
        await this.storeUser(user);
      }

      return { user: user || { id: 0, name: '', email: credentials.email }, token };
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    try {
      const response = await apiService.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.REGISTER,
        data
      );

      // Handle different response formats
      const token = response.token || response.access_token;
      const user = response.user;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Store token and user data
      await this.storeToken(token);
      if (user) {
        await this.storeUser(user);
      }

      return { user: user || { id: 0, name: data.name, email: data.email }, token };
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      try {
        await apiService.post(API_CONFIG.ENDPOINTS.LOGOUT);
      } catch (error) {
        // Ignore logout endpoint errors (token might already be invalid)
        console.log('Logout endpoint error (ignored):', error);
      }

      // Clear stored data
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      
      // Clear API service token
      apiService.setAuthToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to clear local data even if API call fails
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        apiService.setAuthToken(null);
      } catch (clearError) {
        console.error('Error clearing local data:', clearError);
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null && token.length > 0;
  }

  /**
   * Initialize auth state (load token on app start)
   */
  async initialize(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    try {
      const token = await this.getToken();
      const user = await this.getUser();

      if (token) {
        // Set token in API service
        apiService.setAuthToken(token);
        
        // Optionally verify token is still valid by fetching user
        try {
          const response = await apiService.get<any>(API_CONFIG.ENDPOINTS.USER);
          // Handle Laravel response structure: { user: {...} } or direct user object
          const currentUser = response.user || response;
          if (currentUser && currentUser.id) {
            await this.storeUser(currentUser);
            return { isAuthenticated: true, user: currentUser };
          }
        } catch (error: any) {
          // Only clear auth if it's a 401 (unauthorized) - token is invalid
          // For other errors (network, 404, etc.), keep the token and use stored user
          if (error.status === 401) {
            console.log('Token is invalid (401), clearing auth:', error);
            await this.logout();
            return { isAuthenticated: false, user: null };
          } else {
            // Token exists but validation failed for other reasons (network, etc.)
            // Keep user authenticated with stored user data
            console.log('Token validation failed (non-401), using stored user:', error.message);
            return { isAuthenticated: true, user };
          }
        }
      }

      return { isAuthenticated: !!token, user };
    } catch (error) {
      console.error('Auth initialization error:', error);
      return { isAuthenticated: false, user: null };
    }
  }
}

export const authService = new AuthService();
