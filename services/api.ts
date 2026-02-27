/**
 * API Service
 * 
 * This file provides a centralized API service for making HTTP requests
 * to the Laravel backend. You can extend this with specific API methods.
 */

import { API_CONFIG, getApiUrl } from '@/constants/api';

// Laravel API Error Response Types
export interface LaravelErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// For now, using fetch (built-in)
class ApiService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.headers = {
      ...API_CONFIG.HEADERS,
      // Add authorization token here when implementing auth
      // 'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Set authorization token (Laravel Sanctum)
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  /**
   * Handle API errors and parse Laravel error responses
   */
  private async handleError(response: Response): Promise<never> {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    let errors: Record<string, string[]> | undefined;

    try {
      const errorData: LaravelErrorResponse = await response.json();
      
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      if (errorData.errors) {
        errors = errorData.errors;
        // Format validation errors into a readable message
        const validationMessages = Object.entries(errorData.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        errorMessage = validationMessages || errorMessage;
      }
    } catch {
      // If response is not JSON, use default error message
    }

    // Provide helpful messages for common status codes
    if (response.status === 401) {
      errorMessage = `Authentication Required: ${errorMessage}\n\nThis endpoint requires you to be logged in. You may need to:\n1. Implement login functionality\n2. Store and send authentication tokens\n3. Or make this endpoint public in your Laravel API`;
    } else if (response.status === 422) {
      // Laravel validation errors - format is already handled above
      // But provide a more user-friendly message if no specific errors
      if (!errors || Object.keys(errors).length === 0) {
        errorMessage = `Validation Error: ${errorMessage}`;
      }
    } else if (response.status === 403) {
      errorMessage = `Forbidden: ${errorMessage}\n\nYou don't have permission to access this resource.`;
    } else if (response.status === 404) {
      errorMessage = `Not Found: ${errorMessage}\n\nThe endpoint may not exist or the route is incorrect.`;
    } else if (response.status === 500) {
      errorMessage = `Server Error: ${errorMessage}\n\nThere's an issue with the Laravel server. Check the server logs.`;
    }

    throw new ApiError(errorMessage, response.status, errors);
  }

  /**
   * Create an AbortSignal with timeout
   */
  private createTimeoutSignal(timeout: number): AbortSignal {
    // Use AbortSignal.timeout if available (newer environments)
    if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
      return (AbortSignal as any).timeout(timeout);
    }
    
    // Fallback: create manual timeout
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = getApiUrl(endpoint);
    
    // Debug logging (remove in production)
    if (__DEV__) {
      console.log(`[API] GET ${url}`);
      console.log(`[API] Headers:`, JSON.stringify(this.headers, null, 2));
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        // Add timeout handling
        signal: this.createTimeoutSignal(API_CONFIG.TIMEOUT),
      });

      // Debug logging
      if (__DEV__) {
        console.log(`[API] Response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token might be invalid
        if (response.status === 401) {
          // Clear token and let the error handler deal with it
          this.setAuthToken(null);
        }
        await this.handleError(response);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return {} as T;
    } catch (error: any) {
      // Handle network errors, timeouts, and other fetch failures
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new ApiError(
          `Request timeout: The server took too long to respond. Check if your Laravel server is running at ${this.baseUrl}`,
          0
        );
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError(
          `Network error: Cannot connect to ${this.baseUrl}. Make sure:\n1. Your Laravel server is running\n2. The server is accessible from the simulator\n3. CORS is configured properly`,
          0
        );
      } else if (error instanceof ApiError) {
        // Re-throw ApiError as-is
        throw error;
      } else {
        throw new ApiError(
          `Network error: ${error.message || 'Unknown error occurred'}. Check your connection to ${this.baseUrl}`,
          0
        );
      }
    }
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = getApiUrl(endpoint);
    
    // Debug logging (remove in production)
    if (__DEV__) {
      console.log(`[API] POST ${url}`, data ? JSON.stringify(data, null, 2) : '');
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: this.createTimeoutSignal(API_CONFIG.TIMEOUT),
      });
      
      // Debug logging
      if (__DEV__) {
        console.log(`[API] Response status: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        await this.handleError(response);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return {} as T;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new ApiError(
          `Request timeout: The server took too long to respond. Check if your Laravel server is running at ${this.baseUrl}`,
          0
        );
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError(
          `Network error: Cannot connect to ${this.baseUrl}. Make sure your Laravel server is running.`,
          0
        );
      } else if (error instanceof ApiError) {
        throw error;
      } else {
        throw new ApiError(
          `Network error: ${error.message || 'Unknown error occurred'}`,
          0
        );
      }
    }
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Example usage:
// import { apiService } from '@/services/api';
// import { API_CONFIG } from '@/constants/api';
// 
// const recipes = await apiService.get(API_CONFIG.ENDPOINTS.RECIPES_SEARCH + '?ingredients[]=chicken');
