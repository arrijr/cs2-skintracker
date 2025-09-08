// frontend/src/lib/http.ts — [Frontend]
// {/* Centralized HTTP client with Error Tracking & Logging */}
import { logger } from './logger';

// Error context integration (will be set by the app)
let errorContext: {
  showError: (message: string, type?: "error" | "warning" | "info" | "success", persistent?: boolean) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  clearError: () => void;
  showToast: (message: string, type?: "success" | "error" | "loading") => void;
} | null = null;

// Function to set error context (called by the app)
export function setErrorContext(context: typeof errorContext) {
  errorContext = context;
}

/**
 * Centralized API fetch function with Clerk authentication and error tracking
 * Handles both client-side and server-side requests safely
 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const url = `${baseURL}${path.startsWith('/') ? path : `/${path}`}`;
  const method = init.method || 'GET';
  const startTime = Date.now();

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers,
  };

  // Add Clerk authentication for client-side requests
  if (typeof window !== 'undefined') {
    try {
      // Client-side: Get token from Clerk
      const { useAuth } = await import('@clerk/nextjs');
      // Note: In a real app, you'd get the token from the auth context
      // For now, we'll let the backend handle auth via Clerk middleware
    } catch (error) {
      logger.warn('Failed to get Clerk token', {
        action: 'auth_token_fetch',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  // Log API call start
  logger.debug(`API ${method} ${path}`, {
    action: 'api_call_start',
    metadata: {
      url,
      method,
      headers: Object.keys(headers),
    },
  });

  // Make the request
  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    const duration = Date.now() - startTime;

    // Log successful API call
    logger.apiCall(path, method, response.status, duration);

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      const error = new Error(
        errorData.message || 
        errorData.error || 
        `HTTP ${response.status}: ${response.statusText}`
      );

      // Log API error
      logger.error(`API ${method} ${path} failed`, error, {
        action: 'api_call_error',
        metadata: {
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          duration,
          errorData,
        },
      });

      // Show error in UI if context is available
      if (errorContext) {
        const errorMessage = error.message || `Request failed (${response.status})`;
        errorContext.showError(errorMessage, "error", response.status >= 500);
      }

      throw error;
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log network/parsing errors
    logger.error(`API ${method} ${path} network error`, error as Error, {
      action: 'api_call_network_error',
      metadata: {
        url,
        method,
        duration,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });

    // Show network error in UI if context is available
    if (errorContext) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      errorContext.showError(errorMessage, "error", true); // Network errors are persistent
    }

    throw error;
  }
}

/**
 * HTTP client class for more advanced usage with error tracking
 */
export class HttpClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Clerk authentication for client-side requests
    if (typeof window !== 'undefined') {
      try {
        const { useAuth } = await import('@clerk/nextjs');
        // Note: In a real app, you'd get the token from the auth context
        // For now, we'll let the backend handle auth via Clerk middleware
      } catch (error) {
        logger.warn('Failed to get Clerk token in HttpClient', {
          action: 'http_client_auth_token_fetch',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    return headers;
  }

  private async makeRequest<T = any>(
    method: string,
    path: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const headers = await this.getHeaders();
    
    return apiFetch(path, {
      method,
      headers: { ...headers, ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async get<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('GET', path, undefined, options);
  }

  async post<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('POST', path, data, options);
  }

  async put<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('PUT', path, data, options);
  }

  async patch<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('PATCH', path, data, options);
  }

  async delete<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('DELETE', path, undefined, options);
  }
}

// Default HTTP client instance
export const http = new HttpClient();

// Legacy compatibility exports
export default http;