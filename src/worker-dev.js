import { handleAnalyticsRequest } from './analytics.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/dev/__owl/analytics') {
      return handleAnalyticsRequest(request, env, { environment: 'dev' });
    }

    // The dev-public/dev directory mirrors the public /dev path exactly.
    const response = await env.ASSETS.fetch(request, { cache: "no-store" });
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, max-age=0");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
