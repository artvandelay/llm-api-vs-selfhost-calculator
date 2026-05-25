# API vs Self-Host LLM Cost Calculator

https://artvandelay.github.io/llm-api-vs-selfhost-calculator/

Given your traffic and the API price you'd pay today, this calculator finds the
**largest open-weight model you could self-host for the same cost or less** — and
also surfaces the cheapest viable tier in case you want to optimize for spend
instead of quality.

It's a single-page React app, no backend, all math runs in the browser.

> **Live demo**: deploy with `npm run build` and serve `dist/` (Vercel,
> Netlify, GitHub Pages, Cloudflare Pages — anything static works).

## What it models

- **API cost**: queries/week × (input × in_rate + output × out_rate) / 1M.
- **Self-host cost**: cheapest GPU that fits the model at your chosen
  quantization, billed under three modes — always-on, hourly-while-warm, and
  per-second scale-to-zero — picking whichever is cheapest for your traffic
  pattern.
- **Saturation**: if peak-hour throughput exceeds one GPU's capacity, costs
  scale by replica count and the tier is flagged.
- **Fine-tuning**: amortized over a configurable horizon and added to weekly
  self-host cost.

What it deliberately doesn't model: engineering effort (serving infra, evals,
monitoring, on-call), batch/concurrency speedups, KV-cache reuse across requests,
network egress, or quality differences between models.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build      # outputs dist/
npm run preview    # serve the build locally
```

## Updating prices

All pricing lives in [`src/pricing.json`](./src/pricing.json) — GPU hourly
rates per vendor and API rates per provider. Edit and rebuild.

## Project layout

```
src/
  App.tsx          UI
  engine.ts        Pure, typed calculation engine (no React)
  pricing.json     GPU + API price table
  useUrlState.ts   Tiny querystring-backed state hook (share links)
  index.css        Tailwind entry
  main.tsx         React bootstrap
```

The engine is intentionally separated from the UI so you can import it into a
script or a notebook to run scenarios offline.

## Share links

Every input writes to the URL query string, so you can paste a link with all
your assumptions baked in. Click **Copy share link** in the header.

## Known limitations / TODOs

- Throughput is a single rule of thumb (~120 tok/s per 8B active params per
  H100-class 80GB unit, scaled linearly). Real numbers depend heavily on
  batching, prefix caching, and engine choice (vLLM, SGLang, TensorRT-LLM).
- GPU hourly rates are approximate as of `pricing.json:last_updated` —
  verify against your vendor before quoting.
- No quality-equivalence model: a 70B open-weight model is not necessarily a
  drop-in for GPT-5 on your task. Run evals.
- No batch/throughput discount modeling for very high QPS.

## Provenance

Original first draft sketched in a Claude Code session, then critiqued and
hardened in Cursor — typed engine extracted from UI, side-effect-in-`useMemo`
removed, saturation/replicas surfaced, URL state added, accessibility on
tooltips fixed.

## License

MIT.
