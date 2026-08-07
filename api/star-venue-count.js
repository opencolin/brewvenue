// api/star-venue/[city]/[k].js — read the current star total for one venue.
// Route shape: GET /api/star-venue/:city/:k
// Response: { ok, k, city, count } — "count" is what the star button displays.
// Falls back to 0 if KV is not configured, so the UI never errors out.
//
// Vercel dynamic-route mapping: place this file at api/star-venue/[city]/[k].js
// so /api/star-venue/los-angeles/jimmy_smith maps city="los-angeles", k="jimmy_smith".

const { kv } = require("@vercel/kv");
const KEY = (city, k) => "venue:star:" + city + ":" + k;

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") return res.status(405).end(JSON.stringify({ error: "method_not_allowed" }));
  const { city, k } = req.query;
  if (!city || !k) return res.status(400).json({ ok: false, error: "bad_request" });
  if (!process.env.KV_REST_API_URL) return res.status(200).json({ ok: false, count: 0, city, k });
  try {
    const count = await kv.get(KEY(city, k));
    res.status(200).json({ ok: true, count: Number(count || 0), city, k });
  } catch (e) {
    res.status(500).json({ ok: false, error: "internal", detail: e.message || String(e) });
  }
};
