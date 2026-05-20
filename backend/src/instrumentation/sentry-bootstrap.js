// /backend/src/instrumentation/sentry-bootstrap.js
//
// Side-effect-only module. Loaded as the FIRST import of app.js so that:
//   1. dotenv is configured before any other module reads process.env
//   2. Sentry initialises as early as possible.
//
// NOTE on ESM + auto-instrumentation:
// With Express + ESM, @sentry/node v8+ recommends using --import to attach
// auto-instrumentation (perf traces, db breadcrumbs) BEFORE the app graph
// loads:
//   node --import ./src/instrumentation/sentry-bootstrap.js src/server.js
// For Sprint 0 we only need ERROR capture (which Sentry.setupExpressErrorHandler
// + Sentry.captureException provide regardless). Once we want perf traces,
// flip start scripts to use --import.
//
// Imported for side effects only — exports nothing.

import dotenv from "dotenv";
dotenv.config();

import { initSentry } from "./sentry.js";
initSentry();
