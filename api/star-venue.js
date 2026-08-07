// api/star-venue.js — upvote a venue.
//
// POST body: { k: "<venue key>", city: "<city slug>", action: "star" }
// Effect: increments the star total in Vercel KV (Redis), returns { ok, newCount }.
// Client keeps a localStorage per-browser flag (`starred:<city>:<k>`) so visitors
// cannot double-star silently from one browser (but no true identity check — fine
// for a soft favorite signal).
//
// Env: KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV).
// Note: Vercel KV only ships when a KV store is attached; when unavailable the
// response is 501 with ok:false so the UI can hide the star count.

const { kv } = require("@vercel/kv");

const KEY = k => "venue:star:" + k;

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (!process.env.KV_REST_API_URL) return res.status(501).json({ ok: false, error: "kv_not_configured" });
  if (req.method !== "POST") return res.status(405).end(JSON.stringify({ error: "method_not_allowed" }));

  try {
    const { k, city } = req.body || {};
    if (!k || typeof k !== "string" || k.length > 80) return res.status(400).json({ ok: false, error: "missing_key" });
    if (!city || typeof city !== "string" || city.length > 60) return res.status(400).json({ ok: false, error: "missing_city" });

    const key = KEY(city + ":" + k);
    // increment the counter
    const newCount = await kv.incr(key);
    // track a per-venue-last-starred timestamp for rate limiting (light anti-flood)
    await kv.set(key + ":ts", Date.now(), { ex: 86400 });
    return res.status(200).json({ ok: true, newCount });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "internal", detail: e.message || String(e) });
  }
};
