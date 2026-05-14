// Inngest client — single instance shared across all function definitions.
// Per ADR-004: Inngest orchestrates our background jobs (catalog-sync, price-refresh, alerts).
import { Inngest } from 'inngest';

// In dev (no INNGEST_SIGNING_KEY), run against the local Inngest CLI dev server.
// In prod, signing-key is required and the SDK talks to Inngest Cloud.
const isDev = !process.env.INNGEST_SIGNING_KEY;

export const inngest = new Inngest({
  id: 'cs2-skin-tracker',
  isDev,
  // Event key for sending events (required in prod, optional in dev).
  eventKey: process.env.INNGEST_EVENT_KEY,
});
