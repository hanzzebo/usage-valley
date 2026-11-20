# Token Valley

A 16-bit pixel landscape that visualizes your Claude Code usage: time of day, weather and villagers react to how much of your usage window is left. Unofficial; not affiliated with Anthropic.

## Run

```
npm start
```

Open http://localhost:4747. The scene updates every 10s from your real usage. Opening `index.html` directly (or on GitHub Pages) starts a static DEMO instead.

## Tune the limit

Claude Code doesn't expose your real plan limit, so `windowTokenLimit` in `config.json` (default 500000 input+output tokens per 5-hour window) is an estimate. Put your own value in `config.local.json` (git-ignored), e.g. `{ "windowTokenLimit": 200000 }`. Cache tokens are reported by the API but not counted.

## Weather

| Usage left | Weather |
|---|---|
| > 50% | clear |
| > 25–50% | cloudy |
| > 10–25% | rain |
| ≤ 10% | storm |

One villager per session active today.

## Privacy

Reads `~/.claude/projects/**/*.jsonl` read-only, binds to 127.0.0.1 only, and sends nothing anywhere.

## Credits

Art: "Sunny Land" by ansimuz, CC0 — https://opengameart.org/content/sunny-land-2d-pixel-art-pack. Code: MIT.
