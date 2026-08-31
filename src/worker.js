import { handleAnalyticsRequest } from './analytics.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/__owl/analytics') {
      return handleAnalyticsRequest(request, env, { environment: 'prod' });
    }

    return env.ASSETS.fetch(request);
  },
};
