const fs = require("fs"), path = require("path"), os = require("os");
const ROOT = path.join(os.homedir(), ".claude", "projects"), H5 = 5 * 3600e3;

function* jsonls(dir) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* jsonls(p); else if (e.name.endsWith(".jsonl")) yield p;
  }
}

// Collect deduped assistant messages (one API response is logged once per content block).
function collect(now, root) {
  const seen = new Set(), msgs = [];
  for (const f of jsonls(root)) {
    // shortcut: files untouched for 48h are skipped, so a window chain older than that is invisible; fine for a 5h window
    try { if (now - fs.statSync(f).mtimeMs > 48 * 3600e3) continue } catch { continue }
    let txt; try { txt = fs.readFileSync(f, "utf8") } catch { continue }
    for (const line of txt.split("\n")) {
      if (!line.includes('"usage"')) continue;
      let o; try { o = JSON.parse(line) } catch { continue }
      const m = o.message, u = m && m.usage, ts = Date.parse(o.timestamp);
      if (o.type !== "assistant" || !u || isNaN(ts) || m.model === "<synthetic>") continue;
      const id = m.id || o.requestId;
      if (id) { if (seen.has(id)) continue; seen.add(id) }
      msgs.push({ ts, sid: o.sessionId || path.basename(f, ".jsonl"), io: (u.input_tokens || 0) + (u.output_tokens || 0), cache: (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) });
    }
  }
  return msgs.sort((a, b) => a.ts - b.ts);
}

function compute(limit, now = Date.now(), root = ROOT) {
  const msgs = collect(now, root), day0 = new Date(now).setHours(0, 0, 0, 0);
  const sessionsToday = new Set(msgs.filter(m => m.ts >= day0).map(m => m.sid)).size;
  let start = null, tokensInWindow = 0, cacheTokens = 0;
  for (const m of msgs) {
    if (start === null || m.ts >= start + H5) { start = m.ts; tokensInWindow = cacheTokens = 0 }
    tokensInWindow += m.io; cacheTokens += m.cache;
  }
  const active = start !== null && now < start + H5;
  if (!active) return { leftPct: 100, sessionsToday, resetAt: null, windowStart: null, tokensInWindow: 0, cacheTokens: 0, limit, updatedAt: now };
  const leftPct = Math.min(100, Math.max(0, 100 - tokensInWindow / limit * 100));
  return { leftPct: Math.round(leftPct * 10) / 10, sessionsToday, resetAt: start + H5, windowStart: start, tokensInWindow, cacheTokens, limit, updatedAt: now };
}

module.exports = { compute };
