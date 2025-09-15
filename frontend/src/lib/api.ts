// frontend/src/lib/api.ts — [Frontend]
// {/* Centralized API URL Helper */}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN!;

export const apiUrl = (path: string) =>
  `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;

// Re-export existing apiFetch for backward compatibility
export { apiFetch } from './http';