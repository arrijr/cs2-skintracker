// frontend/src/lib/http/server.ts — [Frontend]
// {/* Server-Safe HTTP client with Clerk Authentication & Error Tracking */}
// {/* Server-only implementation for server components and API routes */}
import 'server-only';

/**
 * Get Clerk authentication token for API requests
 * Server-only implementation using @clerk/nextjs/server
 */
async function getClerkToken(): Promise<string | null> {
  try {
    // Server-side: Use Clerk's auth() function
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    return await session?.getToken();
  } catch (error) {
    console.warn('Failed to get Clerk token on server:', error);
    return null;
  }
}

/**
 * Centralized API fetch function with Clerk authentication and error tracking
 * Server-only implementation - works only in server components and API routes
 * 
 * @param path - API endpoint path (e.g., '/skins' or 'skins')
 * @param init - Optional fetch configuration
 * @returns Promise with API response data
 */
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const url = `${baseURL}${path.startsWith('/') ? path : `/${path}`}`;
  const method = init.method || 'GET';
  const startTime = Date.now();

  // Get Clerk token (server-side)
  const token = await getClerkToken();

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  // Add Clerk authentication token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    
    // Debug: JWT Claims quick peek (server)
    try {
      const payload = token.split('.')[1];
      const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      console.debug('[AUTH][server] claims:', {
        aud: json.aud,
        iss: json.iss,
        sub: json.sub,
        azp: json.azp,
        exp: json.exp
      });
    } catch {
      console.debug('[AUTH][server] claim-parse-failed');
    }
  }

  // Log API call start (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[SERVER] API ${method} ${path}`, {
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
    const response = await fetch(url, {
      ...init,
      headers,
    });

    const duration = Date.now() - startTime;

    // Log successful API call (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SERVER] API ${method} ${path} - ${response.status} (${duration}ms)`);
    }

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
      console.error(`[SERVER] API ${method} ${path} failed`, {
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

      throw error;
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T;
    }
    
    return await response.text() as T;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log network/parsing errors
    console.error(`[SERVER] API ${method} ${path} network error`, {
      action: 'api_call_network_error',
      metadata: {
        url,
        method,
        duration,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * HTTP client class for more advanced usage with error tracking
 * Server-only implementation
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

    // Add Clerk authentication token (server-side)
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
