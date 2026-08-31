const ALLOWED_EVENTS = new Set(['game_open', 'career_created', 'career_resumed']);
const MAX_PATH_LENGTH = 160;
const MAX_RELEASE_LENGTH = 80;

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
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

  return {
    event,
    environment,
    clientPath,
    release: release || 'unknown',
    visitorId,
  };
}

/*
 * Dataset schema:
 *   blob1 = event name
 *   blob2 = environment (prod/dev)
 *   blob3 = client pathname (/ or /dev/)
 *   blob4 = game release
 *   double1 = event count (1)
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
      blobs: [payload.event, payload.environment, payload.clientPath, payload.release],
      doubles: [1],
      indexes: [payload.visitorId],
    });
  } catch (_) {
    // Analytics must never block or break the game request.
  }

  return response(204);
}
