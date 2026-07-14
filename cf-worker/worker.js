// Cloudflare Worker: edge-cached proxy in front of a private Backblaze B2
// bucket. Backblaze B2 has no CDN of its own — direct downloads measured
// ~1.5-2s per file (TTFB ~750ms). This Worker fixes that: first request for
// a given file authenticates to B2 and fetches it (still slow, one time),
// then caches the response at Cloudflare's edge with a 1-year immutable
// Cache-Control. Every subsequent request for that file, from anyone,
// anywhere, is served straight from Cloudflare's edge — no B2 round trip.
//
// Secrets (set via `wrangler secret put`, never committed):
//   B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_ID, B2_BUCKET_NAME

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, "");
    if (!path) return new Response("Not found", { status: 404 });

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });

    let cached = await cache.match(cacheKey);
    if (cached) return cached;

    // 1. Authorize the account.
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
      headers: { Authorization: "Basic " + btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`) },
    });
    if (!authRes.ok) return new Response("B2 authorize failed", { status: 502 });
    const auth = await authRes.json();
    const apiUrl = auth.apiInfo.storageApi.apiUrl;
    const downloadUrl = auth.apiInfo.storageApi.downloadUrl;

    // 2. Get a short-lived download authorization scoped to this file's prefix.
    const prefix = path.split("/")[0] + "/";
    const daRes = await fetch(`${apiUrl}/b2api/v3/b2_get_download_authorization`, {
      method: "POST",
      headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        bucketId: env.B2_BUCKET_ID,
        fileNamePrefix: prefix,
        validDurationInSeconds: 3600,
      }),
    });
    if (!daRes.ok) return new Response("B2 download authorization failed", { status: 502 });
    const da = await daRes.json();

    // 3. Fetch the actual file from B2.
    const fileUrl = `${downloadUrl}/file/${env.B2_BUCKET_NAME}/${path}?Authorization=${da.authorizationToken}`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) return new Response("Not found", { status: fileRes.status });

    const response = new Response(fileRes.body, {
      status: 200,
      headers: {
        "Content-Type": fileRes.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
