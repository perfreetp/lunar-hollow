# 夜航灯标 · 白礁水道

A night-navigation visualisation for a charted sea area: shaded bathymetry,
multi-lighthouse halo compositing, IALA light-character flicker, and voyage
export.

TypeScript + native Web Components, MapLibre GL JS for the chart, one 2D canvas
for the light. No frameworks, no tile server, no network calls at runtime.

```bash
npm install
npm run dev        # http://localhost:5310
npm test           # 74 unit tests
npm run build      # typecheck + production bundle
npm run e2e        # 46 browser behaviour checks (needs Chrome; run `npm run dev` first)
```

## What it does

- **海图底图** — depth-shaded sea, coastline, isobaths, graticule and soundings
  generated from the chart model at load. The shading and the isobaths come from
  the same depth field, so they can never disagree.
- **灯塔光晕** — each lamp's halo radius derives from luminous intensity, focal
  height, visibility and day/night, then converts to pixels through the live
  Web-Mercator scale. Same ground footprint at every zoom.
- **航标闪烁** — IALA characteristics are parsed (`Fl(2) W 10s`, `Mo(A) W 15s`,
  `VQ(3) G 5s`, `Iso`, `Oc`, `LFl`, `UQ`, `F`…) into a phase sequence that
  drives both the halo envelope and the on/off timing strip in the inspector.
- **导出** — the voyage as JSON, GeoJSON, or a printable briefing.

## The two hard parts

### Overlapping halos must not turn grey

`src/core/glow-compositor.ts` is pure and unit-tested. Two rules:

1. **Ordering.** Lights sort ascending by brightness × proximity: dim and far
   lamps are laid down first, bright and near lamps last, so the dominant lamp
   owns the overlap core.
2. **Overlap suppression.** Each lamp's exposure is divided by the energy of the
   higher-priority lamps it overlaps, weighted by the fraction of its own disc
   that is covered (lens-area formula). A dim lamp under a bright one loses
   exposure; the bright one keeps full gain. Total stack exposure stays *below*
   the naive sum of envelopes, which is the invariant that prevents the grey-out.

Two further details matter visually:

- Sprites are additive and **baked per pixel with dithering**. A radial alpha
  ramp quantised to 8 bits draws contour rings wherever one level spans many
  pixels; dithering scatters those boundaries. The sprite is also clipped to its
  circle so the square texture bounds can never show.
- Exposure is applied with a **max-channel knee** rather than per-channel
  clipping, so a stacked lamp keeps its hue instead of drifting to white.
- The bloom footprint is **bounded to a fraction of the viewport**. A lamp that
  covers a quarter of the window stops reading as a light; when the bound binds,
  the inspector reports the lamp as clamped rather than silently lying about
  scale.

### Halo scale stays stable while zooming

`haloGeometry()` computes a ground-metre radius, then divides by metres-per-pixel
read from the live map transform. `tests/atmosphere.test.ts` and the e2e
suite assert `radiusPx === groundRadiusM / mpp` at several zoom levels. Extreme
zooms clamp for usability and the inspector labels a clamped lamp.

The **screen-scale** toggle holds pixel radius instead, for comparing brightness
independently of chart scale. That is a deliberate A/B, not a fallback.

## Performance

One full-screen canvas, one blit per lamp per frame, sprites baked once at load.
Measured on a Tesla P4 / D3D11 ANGLE at 1600×960: **60 fps** at every zoom
level, while dragging the ship, and with a 1.3× screen worth of overlapping halo
area. The renderer's own paint cost is ~0.3–0.7 ms/frame (median), so the frame
budget belongs to MapLibre and the compositor, not to the light.

Things that were removed because they cost frames for no visual gain: per-label
compositing layers, a full-screen `mix-blend-mode` vignette, a CSS filter on the
WebGL canvas, and a second inner sprite blit. The night wash is painted into the
ink canvas instead of a DOM overlay.

## Layout

```
src/
  core/            pure, tested domain logic
    geo.ts             geodesy, projection scale, formatting
    light-character.ts IALA characteristics → phase sequences
    atmosphere.ts      Allard / geographic range, halo radius, visibility
    glow-compositor.ts ordering, overlap suppression, hue-preserving exposure
    voyage.ts          route geometry, lit-route coverage, nearest aid
    voyage-export.ts   export schema, GeoJSON, briefing text
    raster.ts          distance transform, marching-squares isobaths
    polygon.ts         rings, smoothing, distances
  model/           the chart dataset and the depth field built from it
  render/          MapLibre basemap, glow canvas, ink canvas, DOM labels
  ui/components/   the Web Components (topbar, sidepanel, inspector, …)
  app/             controller (owns map + renderer + store) and state
```

Three clocks used to disagree here — the halo painted one phase, the lit route
another, the inspector strip a third — so the strip could read 明亮 while the
chart painted the lamp dark. All three now sample through
`GlowRenderer.phaseTimeFor()`, and `tests/phase-clock.test.ts` pins that.

The components never touch the map directly. They talk to a narrow `AppApi`
registered on `<body>` and subscribe to a tiny store; the controller forwards
the renderer's 8 Hz view push to whichever component needs live values.

## Data

The chart area (`白礁水道`, CHART 18402) and its twelve aids are **fictional**,
built to exercise the visual problems in this brief: a cluster of three lamps
inside a few kilometres, a lighthouse with a morse character, a fixed-sector
tower, quick-flashing reef beacons, and buoys on each channel entrance. IALA
notation follows the real standard; the geography does not.

## Known limits

- Depth is derived from distance-to-shore plus a channel axis term, not from
  survey data. Isobaths are therefore smooth and plausible rather than
  realistic.
- Land shadowing is sampled at three points along the sight line, so a narrow
  island can be missed.
- Halos are near-field bloom, not full luminous range. The charted range
  (Allard + dip of horizon) is what the inspector reports and what the lit route
  stretches use; the bloom is deliberately a small fraction of it, because a
  literal 20 nm halo would cover the chart.
- The halo is a lighting model tuned for legibility, not a radiometric one; the
  inspector reports both the charted visible range and the near-field bloom
  radius because they answer different questions.
