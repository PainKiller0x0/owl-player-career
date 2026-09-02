const ALLOWED_EVENTS = new Set([
  'alpha_demo_open',
  'alpha_demo_start',
  'alpha_season_complete',
  'alpha_auto_complete',
  'alpha_batch_complete'
]);

function headersFor(source) {
  const headers = new Headers(source.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return headers;
}

async function writeAnalytics(env, body) {
  if (!env.OWL_ANALYTICS || !ALLOWED_EVENTS.has(body.event)) return;
  await env.OWL_ANALYTICS.writeDataPoint({
    indexes: [body.event],
    blobs: [String(body.visitor || 'anonymous'), String(body.device || 'unknown'), String(body.viewport || 'unknown'), String(body.mode || 'manual')],
    doubles: [Number(body.durationMs) || 0]
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/alpha') {
      const redirect = Response.redirect(new URL('/alpha/', url), 308);
      return new Response(redirect.body, { status: redirect.status, headers: headersFor(redirect) });
    }
    if (url.pathname === '/alpha/__owl/analytics') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: headersFor(new Response()) });
      try {
        const body = await request.json();
        if (!ALLOWED_EVENTS.has(body.event)) return new Response('Bad Request', { status: 400, headers: headersFor(new Response()) });
        await writeAnalytics(env, body);
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' } });
      } catch (error) {
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' } });
      }
    }
    const response = await env.ASSETS.fetch(request);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: headersFor(response) });
  }
};
