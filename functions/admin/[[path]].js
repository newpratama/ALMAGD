// functions/admin/[[path]].js
// Cloudflare Pages Function: SPA fallback for Admin Portal (/admin/*)

export async function onRequest(context) {
  const { request, env, next } = context;

  // 1. Try to serve existing static file (assets, css, js, images, favicon)
  const response = await next();

  // 2. If file physically exists, return it directly
  if (response.status !== 404) {
    return response;
  }

  // 3. If 404, it's a client-side route (e.g. /admin/login, /admin/bookings)
  // Rewrite internally to /admin/index.html so React Router handles the route
  const adminIndexUrl = new URL('/admin/index.html', request.url);
  return env.ASSETS.fetch(adminIndexUrl);
}
