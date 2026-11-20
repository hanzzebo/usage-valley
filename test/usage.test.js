const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), path = require("path");
const { compute } = require("../usage");

test("compute: new window after 5h gap, duplicate ids counted once", () => {
  const dir = fs.mkdtempSync(path.join(__dirname, "tmp-"));
  try {
    const now = Date.now(), H = 3600e3;
    const line = (ts, id, n) => JSON.stringify({ type: "assistant", timestamp: new Date(ts).toISOString(), sessionId: "s1", message: { id, model: "m", usage: { input_tokens: n, output_tokens: 0 } } });
    fs.writeFileSync(path.join(dir, "a.jsonl"), [line(now - 8 * H, "old", 999), line(now - 2 * H, "x", 100), line(now - 2 * H, "x", 100), line(now - H, "y", 50)].join("\n"));
    const r = compute(1000, now, dir);
    assert.strictEqual(r.tokensInWindow, 150);
    assert.strictEqual(r.resetAt, now - 2 * H + 5 * H);
    assert.strictEqual(r.leftPct, 85);
  } finally { fs.rmSync(dir, { recursive: true }) }
});
