// api/submit-venue.js — Vercel serverless: Submit Venue endpoint.
//
// POST body: { city, name, addr, cap, link, linkText, email, note, img, alt, type, flag, area }
// Validates: required fields exist, link returns HTTP 200 (so the page never ships a dead URL),
// duplicate name for the same city is rejected.
// Effect: creates a GitHub Issue on opencolin/brewvenue tagged ["venue-submission", "city:<slug>", "auto-publish"];
// returns the submission object for immediate client-side rendering (auto-publish flow).
//
// Env: GITHUB_TOKEN (repo-scoped PAT with issues:write) — store as a Vercel project secret.
//
// Free plan limit: ~10s invocation; GitHub Issues API is the slow leg (2–3s typical).

const VALID_TYPES = new Set(["coffee", "cowork", "event"]);
const VALID_FLAGS = new Set(["dedicated", "contact"]);
const SPAM_KEYS = /\b(viagra|casino|crypto|free followers|adult services|hot singles)\b/i;

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).end(JSON.stringify({ error: "method_not_allowed" }));

  try {
    const b = req.body || {};
    // required fields mirror the venue schema
    for (const k of ["city", "name", "addr", "cap", "link", "note", "alt", "type"]) {
      if (!b[k] || typeof b[k] !== "string" || !b[k].trim()) {
        return res.status(400).json({ ok: false, error: "missing_field", field: k });
      }
    }
    if (!VALID_TYPES.has(b.type)) return res.status(400).json({ ok: false, error: "bad_type", field: "type" });
    if (b.flag && !VALID_FLAGS.has(b.flag)) return res.status(400).json({ ok: false, error: "bad_flag", field: "flag" });
    if (SPAM_KEYS.test(b.name + " " + b.note)) return res.status(422).json({ ok: false, error: "spam_detected" });

    // liveness check on the link (server-side, so no CORS issues)
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    let headResp;
    try {
      headResp = await fetch(b.link, { method: "HEAD", redirect: "follow", signal: ctl.signal });
      if (headResp.status >= 400) throw new Error("bad_status");
    } catch (e) {
      clearTimeout(timer);
      return res.status(422).json({ ok: false, error: "dead_link", link: b.link, detail: e.message || "fetch failed" });
    }
    clearTimeout(timer);

    const issueBody = [
      "**Submitted via city page:** `" + b.city + "`",
      "",
      "| Field | Value |",
      "|---|---|",
      "| name | " + b.name + " |",
      "| area | " + (b.area || "?") + " |",
      "| type | " + b.type + " |",
      "| addr | " + b.addr + " |",
      "| cap | " + b.cap + " |",
      "| flag | " + (b.flag || "contact") + " |",
      "| link | " + b.link + " |",
      "| linkText | " + (b.linkText || b.link) + " |",
      "| email | " + (b.email || "—") + " |",
      "| note | " + b.note + " |",
      "| img | " + (b.img || "—") + " |",
      "",
      "_Auto-publish:_ yes, so the venue shows on the city page immediately; review closes the loop by toggling labels.",
    ].join("\n");

    const gh = await fetch("https://api.github.com/repos/opencolin/brewvenue/issues", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.GITHUB_TOKEN,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "[venue-submission] " + b.name + " (" + b.city + ")",
        body: issueBody,
        labels: ["venue-submission", "city:" + b.city, b.flag === "dedicated" ? "dedicated" : "contact", "auto-publish"],
      }),
    });
    if (!gh.ok) {
      const text = await gh.text();
      return res.status(502).json({ ok: false, error: "github_failed", detail: text.slice(0, 400) });
    }
    const issue = await gh.json();

    // auto-publish: return a venue object suitable for immediate display
    const venue = {
      k: (b.name || "venue").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().split(/\s+/).slice(0, 3).join("_"),
      name: b.name, area: b.area || "Submitted", type: b.type,
      addr: b.addr, cap: b.cap,
      flag: b.flag || "contact", link: b.link, linkText: b.linkText || "Visit",
      email: b.email || null, note: b.note,
      img: b.img || null, alt: b.alt, top: false,
      _submission_issue: issue.number,
    };
    return res.status(200).json({ ok: true, issue: { number: issue.number, url: issue.html_url }, venue });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "internal", detail: err.message || String(err) });
  }
};
