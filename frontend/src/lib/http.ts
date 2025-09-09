// frontend/src/lib/http.ts — [Frontend]
// {/* HTTP Layer Re-Export Wrapper */}
// {/* Automatically chooses client or server implementation based on environment */}

// Re-export client implementation by default
// This ensures client components get the client-safe version
export { 
  apiFetch, 
  setErrorContext, 
  HttpClient, 
  http,
  default 
} from './http/client';

// For server components, import from './http/server' explicitly
// Example: import { apiFetch } from '@/lib/http/server'