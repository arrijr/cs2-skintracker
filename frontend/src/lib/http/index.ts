// frontend/src/lib/http/index.ts — [Frontend]
// {/* Client HTTP Barrel – exportiert NUR client.ts */}
// {/* WICHTIG: Hier KEINE Re-Exports aus './server'! */}

export { apiFetch, http, HttpClient, setErrorContext } from './client';