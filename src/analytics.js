const ALLOWED_EVENTS = new Set([
  'game_open',
  'career_created',
  'career_resumed',
  'perf_page_load',
  'perf_simulation',
]);
const PERFORMANCE_EVENTS = new Set(['perf_page_load', 'perf_simulation']);
const PERFORMANCE_METRICS = new Set(['page_ready_ms', 'lcp_ms', 'cls', 'inp_ms', 'duration_ms']);
const SIMULATION_MODES = new Set(['single', 'stage', 'whole']);
const SIMULATION_STATUSES = new Set(['completed', 'paused_event', 'paused_manual', 'timeout']);
const DEVICE_CLASSES = new Set(['mobile', 'desktop']);
const VIEWPORT_BUCKETS = new Set(['compact', 'standard', 'wide']);
const MAX_PATH_LENGTH = 160;
const MAX_RELEASE_LENGTH = 80;

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function metricValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 900000) return null;
  return Math.round(number * 10000) / 10000;
}

function response(status) {
  return new Response(null, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

function eventPayload(body, environment) {
  const event = text(body?.event, 40);
  if (!ALLOWED_EVENTS.has(event)) return null;

  const visitorId = text(body?.visitorId, 80);
  const clientPath = text(body?.path, MAX_PATH_LENGTH);
  const release = text(body?.release, MAX_RELEASE_LENGTH);
  if (!visitorId || !clientPath.startsWith('/')) return null;

  const payload = {
    event,
    environment,
    clientPath,
    release: release || 'unknown',
    visitorId,
  };

  if (!PERFORMANCE_EVENTS.has(event)) return payload;

  const metric = text(body?.metric, 40);
  const value = metricValue(body?.value);
  const device = text(body?.device, 16);
  const viewport = text(body?.viewport, 16);
  if (!PERFORMANCE_METRICS.has(metric) || value === null) return null;
  if (!DEVICE_CLASSES.has(device) || !VIEWPORT_BUCKETS.has(viewport)) return null;

  payload.metric = metric;
  payload.value = value;
  payload.device = device;
  payload.viewport = viewport;

  if (event === 'perf_simulation') {
    const mode = text(body?.mode, 16);
    const status = text(body?.status, 20);
    if (!SIMULATION_MODES.has(mode) || !SIMULATION_STATUSES.has(status)) return null;
    payload.mode = mode;
    payload.status = status;
  }

  return payload;
}

/*
 * Dataset schema:
 *   blob1 = event name
 *   blob2 = environment (prod/dev)
 *   blob3 = client pathname (/ or /dev/)
 *   blob4 = game release
 *   blob5 = performance metric (when applicable)
 *   blob6 = simulation mode (when applicable)
 *   blob7 = simulation status (when applicable)
 *   blob8 = device class (mobile/desktop)
 *   blob9 = viewport bucket (compact/standard/wide)
 *   double1 = event count (1)
 *   double2 = metric value (when applicable)
 *   index1 = anonymous visitor id
 */
export async function handleAnalyticsRequest(request, env, { environment }) {
  if (request.method !== 'POST') return response(405);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return response(204);
  }

  const payload = eventPayload(body, environment);
  if (!payload || !env.OWL_ANALYTICS?.writeDataPoint) return response(204);

  try {
    env.OWL_ANALYTICS.writeDataPoint({
      blobs: [
        payload.event,
        payload.environment,
        payload.clientPath,
        payload.release,
        payload.metric || '',
        payload.mode || '',
        payload.status || '',
        payload.device || '',
        payload.viewport || '',
      ],
      doubles: [1, payload.value ?? 0],
      indexes: [payload.visitorId],
    });
  } catch (_) {
    // Analytics must never block or break the game request.
  }

  return response(204);
}
