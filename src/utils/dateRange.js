const REFERENCE_DATE = '2026-09-23';
const MAX_BUCKETS = 300;

function pad(value) {
  return String(value).padStart(2, '0');
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getPresetRange(preset) {
  const today = new Date(`${REFERENCE_DATE}T00:00:00Z`);
  if (preset === 'ytd') {
    return { from: `${today.getUTCFullYear()}-01-01`, to: REFERENCE_DATE };
  }
  if (preset === 'last12months') {
    const from = new Date(today);
    from.setUTCMonth(from.getUTCMonth() - 12);
    return { from: toISODate(from), to: REFERENCE_DATE };
  }
  if (preset === 'lastBillingCycle') {
    const cycleEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
    const cycleStart = new Date(Date.UTC(cycleEnd.getUTCFullYear(), cycleEnd.getUTCMonth(), 1));
    return { from: toISODate(cycleStart), to: toISODate(cycleEnd) };
  }
  return { from: '2026-08-01', to: REFERENCE_DATE };
}

/* Enumerates bucket start timestamps between from/to, capped for chart/query performance */
export function enumerateBuckets(fromISO, toISO, granularity) {
  const from = new Date(`${fromISO}T00:00:00Z`);
  const to = new Date(`${toISO}T00:00:00Z`);
  const buckets = [];

  if (granularity === 'monthly') {
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    while (cursor <= to && buckets.length < MAX_BUCKETS) {
      buckets.push(cursor.toISOString());
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return buckets;
  }

  const stepMs = granularity === 'hourly' ? 3600000 : 86400000;
  const cursor = new Date(from);
  while (cursor <= to && buckets.length < MAX_BUCKETS) {
    buckets.push(cursor.toISOString());
    cursor.setTime(cursor.getTime() + stepMs);
  }
  return buckets;
}

export function formatBucketLabel(iso, granularity) {
  const date = new Date(iso);
  if (granularity === 'hourly') {
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  }
  if (granularity === 'monthly') {
    return date.toLocaleString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

/* Downsamples an array to at most maxPoints using fixed stride, per perf guidance */
export function sampleForChart(points, maxPoints = 180) {
  if (points.length <= maxPoints) return points;
  const stride = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % stride === 0);
}
