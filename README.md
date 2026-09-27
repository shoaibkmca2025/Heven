# Haven Gifts & Hampers — website concept (4AM Global Media)

Open `index.html` through any static server (e.g. `python3 -m http.server`) — frames load from `f/`, images from `img/`, fonts from `fonts/`.
Opened straight from disk it still works: frames fall back to plain images and fonts are borrowed from Google Fonts.

## Edit
- `src/config.js` — brand, address, Instagram, WhatsApp number (hidden until set), occasions, builder contents, packaging/ribbon colours, collections, FAQ.
- `src/styles.css` — font faces and brand tokens at the top (`:root`).
- `src/body.html` — chapter copy for all 20 sections.
- `src/app.js` — scroll engine, frame scrubbing, ribbon recolour, builder, enquiry.
- `src/vendor/lenis.min.js` — Lenis 1.3.26 (MIT, see `LICENSE-lenis.txt`), eases mouse-wheel scrolling.
- Rebuild: `python src/build.py` (from any folder). It writes `index.html`, and `site/` too if that folder exists.
  `index.html` is generated — edit `src/`, not the built page.

## Deploy
Upload `index.html`, `f/`, `img/` and `fonts/`. Turn on gzip/brotli (the page is ~180 KB of text, ~50 KB gzipped)
and long cache lifetimes for `f/`, `img/` and `fonts/`; most static hosts do both by default.

## How the motion works
- Layout is measured once (load, resize, font swap, content change); each scroll frame is plain arithmetic, so it never forces a re-layout.
- Only scenes on or near the screen do any work. Off-screen scenes settle silently and arrive already in place.
- Follow-smoothing is time-based, so the film feels the same on 60 Hz and 120 Hz screens.
- Mouse wheels are eased by Lenis; touch keeps the platform's own momentum; any navigation key cancels a glide.
- Frames are fetched coarse-to-fine and decoded off the main thread (`createImageBitmap`), only around the part of the film on screen.
- Reduce Motion: no smoothing, no scrubbing, stable compositions per chapter.

## Film frames
`f/d/` desktop 1600px (every frame), `f/m/` mobile 768px (every second frame).
u = unboxing (orig. frames 9–100), s = wax seal (134–169), e = finale (170–215).
Replace with the client's real product film by exporting frames with the same names.
