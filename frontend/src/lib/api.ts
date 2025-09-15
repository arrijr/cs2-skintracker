// frontend/src/lib/api.ts — [Frontend]
// {/* Centralized API URL Helper & Fetcher */}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN!;

if (!API_ORIGIN) {
  throw new Error('NEXT_PUBLIC_API_ORIGIN environment variable is required');
}

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${cleanPath}`;
};

// Enhanced fetchJson with better error handling
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          // Try to parse as JSON for structured error
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
            // If not JSON, use the text as is
            errorMessage = errorText;
          }
        }
      } catch {
        // If we can't read the response body, use the status text
      }

      throw new Error(errorMessage);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

// SWR fetcher for use with useSWR
export const swrFetcher = <T>(url: string): Promise<T> => fetchJson<T>(url);

// Re-export existing apiFetch for backward compatibility
export { apiFetch } from './http';