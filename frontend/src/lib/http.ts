// frontend/src/lib/http.ts — [Frontend]
// {/* HTTP Layer Re-Export Wrapper */}
// {/* Automatically chooses client or server implementation based on environment */}

// Import and re-export to ensure proper function binding
import { 
  apiFetch as clientApiFetch, 
  setErrorContext as clientSetErrorContext, 
  HttpClient as ClientHttpClient, 
  http as clientHttp
} from './http/client';

// Re-export with explicit function references
export const apiFetch = clientApiFetch;
export const setErrorContext = clientSetErrorContext;
export const HttpClient = ClientHttpClient;
export const http = clientHttp;

// For server components, import from './http/server' explicitly
// Example: import { apiFetch } from '@/lib/http/server'