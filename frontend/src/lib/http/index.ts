// frontend/src/lib/http/index.ts — [Frontend]
// {/* Central HTTP Layer Index - Clean Re-Exports */}
// {/* No ambiguity, no default exports, clean separation */}

// ============================================================================
// CLIENT-SIDE EXPORTS (for Client Components)
// ============================================================================
// These are safe to use in Client Components and will use window.Clerk

export {
  apiFetch as clientApiFetch,
  setErrorContext as clientSetErrorContext,
  HttpClient as ClientHttpClient,
  http as clientHttp
} from './client';

// ============================================================================
// SERVER-SIDE EXPORTS (for Server Components)
// ============================================================================
// These are safe to use in Server Components and will use @clerk/nextjs/server

export {
  apiFetch as serverApiFetch,
  HttpClient as ServerHttpClient,
  http as serverHttp
} from './server';

// ============================================================================
// CONVENIENCE EXPORTS (Client-first by default)
// ============================================================================
// These default to client implementations for backward compatibility

export { clientApiFetch as apiFetch } from './client';
export { clientSetErrorContext as setErrorContext } from './client';
export { ClientHttpClient as HttpClient } from './client';
export { clientHttp as http } from './client';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { default as ClientHttpClientType } from './client';
export type { default as ServerHttpClientType } from './server';
