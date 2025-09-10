// frontend/src/lib/http/client.ts — [Frontend]
// {/* Client-Safe HTTP client with Clerk Authentication & Error Tracking */}
// {/* No server-only imports - works only in client components */}

// Extend Window interface for Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken(): Promise<string | null>;
      };
    };
  }
}

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
 * Get Clerk authentication token for API requests
 * Client-only implementation using window.Clerk
 */
async function getClerkToken(): Promise<string | null> {
  console.log('🔧 [DEBUG] getClerkToken called');
  
  try {
    // Only work in browser environment
    if (typeof window === 'undefined') {
      console.warn('🔧 [DEBUG] getClerkToken called on server side - returning null');
      return null;
    }

    console.log('🔧 [DEBUG] Window object available, checking Clerk...');
    console.log('🔧 [DEBUG] window.Clerk:', !!window.Clerk);
    console.log('🔧 [DEBUG] window.Clerk.session:', !!window.Clerk?.session);

    // Check if Clerk is available on window
    if (!window.Clerk || !window.Clerk.session) {
      console.debug('🔧 [DEBUG] Clerk not available on window object');
      return null;
    }

  // Get token from Clerk session
  console.log('🔧 [DEBUG] Getting token from Clerk session...');
  console.log('🔧 [DEBUG] Clerk session object:', window.Clerk.session);
  console.log('🔧 [DEBUG] Clerk session methods:', Object.getOwnPropertyNames(window.Clerk.session));
  
  const token = await window.Clerk.session.getToken();
  console.log('🔧 [DEBUG] Token received:', token ? 'present' : 'null');
  console.log('🔧 [DEBUG] Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
  
  // Debug: JWT Claims quick peek (client)
  if (token) {
    try {
      const headPayload = token.split('.')[1];
      const json = JSON.parse(atob(headPayload.replace(/-/g, '+').replace(/_/g, '/')));
      console.debug('[AUTH][client] claims:', {
        aud: json.aud,
        iss: json.iss,
        sub: json.sub,
        azp: json.azp,
        exp: json.exp
      });
    } catch (e) {
      console.debug('[AUTH][client] claim-parse-failed');
    }
  }
    return token;
  } catch (error) {
    console.warn('🔧 [DEBUG] Failed to get Clerk token:', error);
    return null;
  }
}

/**
 * Centralized API fetch function with Clerk authentication and error tracking
 * Client-only implementation - works only in client components
 * 
 * @param path - API endpoint path (e.g., '/skins' or 'skins')
 * @param init - Optional fetch configuration
 * @returns Promise with API response data
 */
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  console.log('🔧 [DEBUG] apiFetch called with:', { path, init });
  
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const url = `${baseURL}${path.startsWith('/') ? path : `/${path}`}`;
  const method = init.method || 'GET';
  const startTime = Date.now();

  console.log('🔧 [DEBUG] Request config:', { baseURL, url, method });

  // Get Clerk token (only in browser)
  const token = await getClerkToken();
  console.log('🔧 [DEBUG] Clerk token:', token ? 'present' : 'missing');

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  // Add Clerk authentication token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔧 [DEBUG] Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log('🔧 [DEBUG] No token available, skipping Authorization header');
  }
  
  console.log('🔧 [DEBUG] Final headers being sent:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers['Authorization'] ? 'Bearer [TOKEN]' : 'Not set',
    'Other headers': Object.keys(headers).filter(key => !['Content-Type', 'Authorization'].includes(key))
  });

  // Log API call start (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.debug(`API ${method} ${path}`, {
      action: 'api_call_start',
      metadata: {
        url,
        method,
        hasToken: !!token,
        headers: Object.keys(headers),
      },
    });
  }

  // Make the request
  try {
    console.log('🔧 [DEBUG] Making fetch request to:', url);
    const response = await fetch(url, {
      ...init,
      headers,
    });

    const duration = Date.now() - startTime;
    console.log('🔧 [DEBUG] Response received:', { status: response.status, duration });

    // Log successful API call (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`API ${method} ${path} - ${response.status} (${duration}ms)`);
    }

    // Handle non-OK responses
    if (!response.ok) {
      console.log('🔧 [DEBUG] Non-OK response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const errorText = await response.text();
      console.log('🔧 [DEBUG] Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.log('🔧 [DEBUG] Parsed error data:', errorData);
      } catch {
        errorData = { message: errorText };
        console.log('🔧 [DEBUG] Could not parse error as JSON, using raw text');
      }

      const error = new Error(
        errorData.message || 
        errorData.error || 
        `HTTP ${response.status}: ${response.statusText}`
      );

      // Log API error
      console.error(`API ${method} ${path} failed`, {
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
    console.log('🔧 [DEBUG] Response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await response.json();
      console.log('🔧 [DEBUG] Parsed JSON response:', jsonData);
      return jsonData as T;
    }
    
    const textData = await response.text();
    console.log('🔧 [DEBUG] Parsed text response:', textData);
    return textData as T;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('🔧 [DEBUG] Error caught in apiFetch:', {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      duration
    });
    
    // Log network/parsing errors
    console.error(`API ${method} ${path} network error`, {
      action: 'api_call_network_error',
      metadata: {
        url,
        method,
        duration,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        error: error instanceof Error ? error.message : String(error),
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
 * Client-only implementation
 */
export class HttpClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Clerk authentication token (only in browser)
    const token = await getClerkToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
    
    return apiFetch<T>(path, {
      method,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
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
