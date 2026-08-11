/**
 * Abbass Workspace — Sync Worker
 *
 * Endpoints:
 *   GET  /api/state?key=<hash>          -> { data, updatedAt } | { data: null, updatedAt: null }
 *   PUT  /api/state   { key, data, updatedAt }  -> { ok:true } | { rejected:true, serverUpdatedAt }
 *   PUT  /api/files?key=<hash>&id=<id>  (body = raw file, Content-Type = file type)
 *   GET  /api/files?key=<hash>&id=<id>  -> raw file bytes
 *   DELETE /api/files?key=<hash>&id=<id>
 *
 * Files are stored in Workers KV (not R2) so no payment method is required.
 *
 * Security note: `key` is a SHA-256 hash of the user's PIN. It acts as the
 * namespace + auth for a single-user app. Keep the PIN private.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key',
  'Access-Control-Max-Age': '86400',
};

// Keys are SHA-256 hashes of the user's PIN (64 hex chars)
const KEY_RE = /^[0-9a-f]{64}$/;

function validKey(key) {
  return typeof key === 'string' && KEY_RE.test(key);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ---------- STATE (D1) ----------
      if (path === '/api/state') {
        // PUT from the app, POST from navigator.sendBeacon on page unload
        if (request.method === 'GET') {
          const key = url.searchParams.get('key');
          if (!validKey(key)) return json({ error: 'invalid key' }, 400);
          const row = await env.DB.prepare(
            'SELECT data, updated_at FROM workspaces WHERE key = ?'
          ).bind(key).first();
          if (!row) return json({ data: null, updatedAt: null });
          let data = null;
          try { data = JSON.parse(row.data); } catch (e) { /* corrupted — let the client push to repair */ }
          return json({ data, updatedAt: row.updated_at });
        }

        if (request.method === 'PUT' || request.method === 'POST') {
          let body = await request.text();
          let parsed;
          try { parsed = JSON.parse(body); } catch (e) { return json({ error: 'invalid JSON body' }, 400); }
          const { key, data, updatedAt } = parsed;
          if (!validKey(key) || data === undefined || typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) {
            return json({ error: 'invalid key, data or updatedAt' }, 400);
          }
          // Last-write-wins guard: reject pushes older than what we have
          const existing = await env.DB.prepare(
            'SELECT updated_at FROM workspaces WHERE key = ?'
          ).bind(key).first();
          if (existing && existing.updated_at > updatedAt) {
            return json({ rejected: true, serverUpdatedAt: existing.updated_at });
          }
          await env.DB.prepare(
            `INSERT INTO workspaces (key, data, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
          ).bind(key, JSON.stringify(data), updatedAt).run();
          return json({ ok: true });
        }
      }

      // ---------- FILES (Workers KV) ----------
      // KV stores the raw bytes; the content type rides along in metadata.
      if (path === '/api/files') {
        const key = url.searchParams.get('key');
        const id = url.searchParams.get('id');
        if (!validKey(key) || !id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) return json({ error: 'invalid key or id' }, 400);
        const kvKey = `${key}/${id}`;

        if (request.method === 'PUT') {
          const type = request.headers.get('Content-Type') || 'application/octet-stream';
          // Buffer the body first — passing request.body (a stream) straight into
          // KV.put can silently store nothing in some runtimes.
          const buf = await request.arrayBuffer();
          await env.FILES.put(kvKey, buf, { metadata: { type } });
          return json({ ok: true, bytes: buf.byteLength });
        }

        if (request.method === 'GET') {
          // getWithMetadata returns { value, metadata } (get with a type option
          // returns the raw value only, losing the stored content type).
          const obj = await env.FILES.getWithMetadata(kvKey, { type: 'arrayBuffer' });
          // Some runtimes return { value: null } for missing keys rather than null.
          if (obj === null || obj.value === null || obj.value === undefined) {
            return json({ error: 'not found' }, 404);
          }
          return new Response(obj.value, {
            headers: {
              'Content-Type': obj.metadata?.type || 'application/octet-stream',
              ...CORS,
            },
          });
        }

        if (request.method === 'DELETE') {
          await env.FILES.delete(kvKey);
          return json({ ok: true });
        }
      }

      return json({ error: 'not found' }, 404);
    } catch (err) {
      return json({ error: err.message || 'server error' }, 500);
    }
  },
};
