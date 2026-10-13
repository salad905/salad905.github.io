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
- **projects** and **gallery** are built from the `PROJECTS` / `GALLERY` arrays in `script.js`. Each has two views: an **overview** to jump from — sticky notes for projects (paginated), and for the gallery one wall of polaroids that scrolls inside its page and **one by one** (each project/photo on its own page; a long project story scrolls inside its page).

Overview pages are re-split whenever the window size changes, so they always fit. Flip with the tabs, the prev/next links at the bottom, the ← → keys, or by swiping on a phone. Each page has a URL (`#resume`, `#gallery/12` for photo 12) and the browser back button works.

## Running locally

No build step — just serve the folder and open it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Playground

The "playground" tab holds the interactive toys, one page each, picked with the switch in the page header (`data-toy`, so each has its own URL: `#playground/colors`, `#playground/photobooth`). Adding another toy means adding another `.page` with a `data-toy` and a line in each switch.

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
