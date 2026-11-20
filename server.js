const http = require("http"), fs = require("fs"), path = require("path");
const { compute } = require("./usage");
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8")) } catch { return {} } };
const cfg = { ...read("config.json"), ...read("config.local.json") };
const limit = cfg.windowTokenLimit > 0 ? +cfg.windowTokenLimit : 500000;
const port = +cfg.port || 4747;
let cache = null;

http.createServer((req, res) => {
  // block DNS rebinding: only answer requests addressed to this machine by name
  if (!/^(localhost|127\.0\.0\.1):\d+$/.test(req.headers.host || "")) { res.writeHead(403); return res.end() }
  const url = req.url.split("?")[0];
  if (url === "/api/usage") {
    if (!cache || Date.now() - cache.at > 9000) cache = { at: Date.now(), data: compute(limit) };
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify(cache.data));
  } else if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
  } else { res.writeHead(404); res.end("not found") }
}).listen(port, "127.0.0.1", () => console.log(`token-valley on http://localhost:${port}`));
