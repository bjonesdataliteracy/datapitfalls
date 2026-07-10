# Testing the datapitfalls → Semiotic annotation bridge

The bridge (`toSemioticAnnotations` / `buildSemioticAnnotationBridge`) does **not**
return an annotated image — it returns the plain annotation *specs* Semiotic's
`annotations` prop consumes. A full round trip has three parts; you can test each
independently.

```
chart image ──①──▶ PitfallReport ──②──▶ annotation specs ──③──▶ annotated chart
              detectPitfalls()       the bridge (this repo)     Semiotic (host app)
              (needs API key)        (pure, no key/network)     (React, browser)
```

## ② Test the bridge alone — no API key, no network

This is "your half." Feed it any `PitfallReport`-shaped object and inspect the output:

```bash
node -e "import('datapitfalls').then(({buildSemioticAnnotationBridge})=>{
  const report={kind:'image',model:'x',rulesConsidered:1,findings:[
    {ruleId:'truncated-axis',name:'Truncated axis',domain:'Graphical Gaffes',severity:'error',
     confidence:'high',nature:'active',condition:'',evidence:'y-axis starts at 90',
     explanation:'',remediation:'Start the axis at zero.'}]};
  console.log(JSON.stringify(buildSemioticAnnotationBridge(report),null,2));
})"
```

The repo's unit suite (`test/semiotic-bridge.test.mjs`, run by `npm test`) already
asserts the mapping, ordering, palette, `max` truncation, and JSON round-trip.

## ① + ② From a chart image to specs — needs an API key

`scan-to-annotations.mjs` scans a chart image and writes `annotations.json`:

```bash
npm run build   # from the repo root, so `import 'datapitfalls'` resolves locally
ANTHROPIC_API_KEY=sk-... node examples/semiotic-bridge/scan-to-annotations.mjs path/to/chart.png
```

In your own project it's the same after `npm install datapitfalls`.

## ③ Render the annotated chart — Semiotic, in a browser

`demo.html` is a self-contained page (React + Semiotic loaded from a CDN, no build
step). It reads `annotations.json` if present, else the checked-in
`annotations.sample.json`, renders a Semiotic `OrdinalFrame`, and — because the
bridge emits **unanchored** notes — positions them itself (anchored to bars *and*
listed in the margin). That positioning step is the "honest seam": **the host app
owns the coordinates.**

Serve the folder (module imports need HTTP, not `file://`) and open it:

```bash
cd examples/semiotic-bridge
python3 -m http.server 8000
# → http://localhost:8000/demo.html
```

> The CDN import (`esm.sh`) needs outbound internet. If your environment blocks it,
> vendor `react`, `react-dom`, and `semiotic` from npm and bundle instead — the
> annotation specs are unchanged.

### What it looks like

`preview.png` in this folder is an illustration of the rendered result (bar chart
with severity-colored pins + margin note cards), generated from
`annotations.sample.json`.
