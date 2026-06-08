export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://ldqohbdvwpsxakjkrjqu.supabase.co';
const FORWARD_HEADERS = ['content-type', 'apikey', 'authorization', 'prefer', 'range', 'x-client-info'];

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(req.url);
  // Strip /api/supabase prefix, keep the rest path + query params
  const targetPath = url.pathname.replace(/^\/api\/supabase/, '') + url.search;
  const targetUrl = SUPABASE_URL + targetPath;

  const headers = new Headers();
  for (const h of FORWARD_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? req.body : null;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    // @ts-ignore - duplex needed for streaming request bodies
    duplex: 'half',
  });

  const resHeaders = new Headers(response.headers);
  resHeaders.set('Access-Control-Allow-Origin', '*');
  resHeaders.delete('transfer-encoding');
  resHeaders.delete('connection');

  return new Response(response.body, {
    status: response.status,
    headers: resHeaders,
  });
}
