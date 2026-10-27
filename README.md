# salad905.github.io

My personal website, about me, resume, projects, a photo gallery, and a personal color analysis tool. Plain HTML/CSS/JS, no build step, hosted on GitHub Pages.

## Structure

- `index.html` — all page markup. The site is a ring binder: divider tabs (`.binder-tabs`) on the right edge, one `.tab-section` per tab (index / about / resume / projects / gallery / playground). The order of the tab buttons is the page order.
- `style.css` — all styling (notebook paper, rings, tabs, and page-turn animation are near the top)
- `script.js` — all behavior: the page engine, the resume/projects/gallery page builders (and their data), and the color analysis tool

### How pages work

The notebook is always exactly one screen tall and the page itself never scrolls; every section is a stack of fixed-size `.page`s. Rule of thumb: things you browse get pages, things you read top to bottom get a sheet that scrolls *inside* its page.

- **index, about** are single pages written directly in `index.html`, as are the two **playground** pages.
- **resume** is written once in `index.html` (inside the hidden `.resume-source`, both default and extended versions). It sits on one page as a taped-on sheet that scrolls. The "download pdf" button links to `Anh_Phan_Resume.pdf`, the real typeset resume that the page content is kept in sync with. (A print stylesheet still produces a clean page if you hit Ctrl+P.)
- **projects** and **gallery** are built from the `PROJECTS` / `GALLERY` arrays in `script.js`. Each opens on an **overview** — sticky notes for projects, polaroids for the gallery — which lives on one page and scrolls inside it. Clicking an item opens its own page, and the "all of them" button there takes you back to the overview at the scroll position you left it (the overview page is never rebuilt, so it keeps its place). A long project story scrolls inside its page.

Flip with the tabs, the prev/next links at the bottom, the ← → keys, or by swiping on a phone. Pages turn inside `.pages`, which holds the shared 3D perspective. It is deliberately not clipped, so a page sweeps out past the edge of the notebook as it turns. Each page has a URL (`#resume`, `#gallery/12` for photo 12) and the browser back button works.

## Running locally

No build step — just serve the folder and open it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Playground

The "playground" tab works the same way: an overview listing the toys, each opening its own page with a way back. Every toy has its own URL (`#playground/colors`, `#playground/photobooth`, `#playground/paint`). Adding one means another `.page` with `data-mode="detail"`, a `data-toy` and a matching `data-item`, plus a card on the overview whose `data-jump` matches.

Each toy card can carry a drawing at `images/toys/<toy>.png` (portrait, 2:3). If the file isn't there the slot removes itself and the card falls back to text, so cards without art still look right.

### Paint

A blank sheet with pencil, marker (translucent), line, box, ellipse, flood fill and eraser, a size slider, swatches plus a colour picker, undo, clear and save-as-PNG. Shapes preview live by stashing the canvas before the drag and repainting it each move, so nothing is committed until you let go; undo keeps a short stack of snapshots. The canvas is redrawn at the new size when the page changes shape, so a resize doesn't wipe what you drew.

### Photobooth

Takes webcam shots on a countdown and draws them onto a strip you can save as a PNG. The camera feed is drawn onto a canvas rather than shown directly, so the funhouse filters bend the live preview exactly the way they bend the photo. Shots appear on the strip as they are taken, with the remaining slots dashed, so you can see what you already have while posing for the next one. Nothing leaves the browser.

Three tables near the top of the photobooth section drive it, and each is meant to be extended by adding a row:

- `BOOTH_LAYOUTS` — `cols` × `rows` gives the shot count (1×3, 1×4, 2×2, 2×3, 1×1).
- `BOOTH_FILTERS` — `css` is a plain colour filter; `warp` bends the picture (`wave`, `bulge`, `pinch`, `wide`, `tall`, `twin`).
- `BOOTH_PAPERS` — the strip background: `fill`, `ink`, and an optional `grid` colour. Image backdrops would hook in here.

## Color analysis tool

The "colors" tab lets you upload a photo or use your webcam, then drapes a ring of color swatches around your face so you can try on different palettes.

- **Face detection** runs entirely in the browser via [face-api.js](https://github.com/justadudewhohacks/face-api.js) (loaded lazily from a CDN only when you open the tab), so nothing is ever uploaded anywhere.
- **Webcam mode** tracks your face live and eases the ring toward it every frame for smooth motion; dragging the ring or resizing it pauses tracking so you can fine-tune, with a button to resume.
- If detection fails or is off, the ring can always be dragged, resized, and rotated by hand.
- **Palettes** are the 12-season personal color analysis system professional colorists use (Light/Warm/Bright Spring, Light/Cool/Soft Summer, Soft/Warm/Deep Autumn, Deep/Cool/Bright Winter).

Since detection depends on a third-party CDN, if it's ever unreachable the tool just falls back to manual placement instead of breaking.

## Deployment

Pushes to `main` publish automatically via GitHub Pages.
