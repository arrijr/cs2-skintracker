// Pure formatting + health helpers for the admin panel. No prisma import → fast unit tests.

export function formatDuration(ms) {
  if (ms == null) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// JobRun.status vocabulary is mixed ('done' legacy from jobService, 'completed'
// from schema). The Jobs-tab badge only styles 'success'/'error' specially.
export function toUiStatus(status) {
  if (status === 'completed' || status === 'done') return 'success';
  if (status === 'failed') return 'error';
  return status; // 'running' | 'queued'
}

// Per-job staleness thresholds in HOURS → { warn, error }.
// TODO(user, learning): tune these numbers to your real cron cadence.
// Defaults assume: price update daily (~03:30 UTC), alert check ~hourly,
// portfolio snapshot daily.
const STALENESS_HOURS = {
  updateSkinPrices:   { warn: 26, error: 50 },
  rebuildSnapshots:   { warn: 30, error: 54 },
  alertCheck:         { warn: 3,  error: 12 },
  steam_skin_import:  { warn: Infinity, error: Infinity }, // user-triggered, never "stale"
  _default:           { warn: 26, error: 50 },
};

export function jobHealth(jobName, lastRun, now = new Date()) {
  if (!lastRun) return 'error';
  const { warn, error } = STALENESS_HOURS[jobName] ?? STALENESS_HOURS._default;
  const ageH = (now.getTime() - new Date(lastRun).getTime()) / 3_600_000;
  if (ageH >= error) return 'error';
  if (ageH >= warn) return 'warning';
  return 'healthy';
}
