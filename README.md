# salad905.github.io

My personal website, as a notebook: about me, resume, projects, a photo gallery, and a playground (a colour analysis tool, a photobooth, and a Paint). Plain HTML/CSS/JS, no build step, hosted on GitHub Pages.

## Structure

- `index.html` — all page markup. The site is a ring binder: divider tabs (`.binder-tabs`) on the right edge, one `.tab-section` per tab (index / about / resume / projects / gallery / playground). The order of the tab buttons is the page order.
- `style.css` — all styling (notebook paper, rings, tabs, and page-turn animation are near the top)
- `script.js` — all behavior: the page engine, the resume/projects/gallery page builders (and their data), the colour analysis tool, and the photobooth
- `paint.js` / `paint.css` — the Paint toy: a self-contained replica of Windows 98 Paint (its own file pair, everything scoped to `.mp-*`)

### How pages work

The notebook is always exactly one screen tall and the page itself never scrolls; every section is a stack of fixed-size `.page`s. Rule of thumb: things you browse get pages, things you read top to bottom get a sheet that scrolls *inside* its page.

- **index, about** are single pages written directly in `index.html`, as are the two **playground** pages.
- **resume** is written once in `index.html` (inside the hidden `.resume-source`, both default and extended versions). It sits on one page as a taped-on sheet that scrolls. The "download pdf" button links to `Anh_Phan_Resume.pdf`, the real typeset resume that the page content is kept in sync with. (A print stylesheet still produces a clean page if you hit Ctrl+P.)
- **projects** and **gallery** are built from the `PROJECTS` / `GALLERY` arrays in `script.js`. Each opens on an **overview** — sticky notes for projects, polaroids for the gallery — which lives on one page and scrolls inside it. Clicking an item opens its own page, and the "back to overview" button there takes you back to the overview at the scroll position you left it (the overview page is never rebuilt, so it keeps its place). A long project story scrolls inside its page.

Flip with the tabs, the prev/next links at the bottom, or the ← → keys. (There is deliberately no swipe-to-turn on phones: it fights with drawing and scrolling.) Pages turn inside `.pages`, which holds the shared 3D perspective. It is deliberately not clipped, so a page sweeps out past the edge of the notebook as it turns. Each page has a URL (`#resume`, `#gallery/12` for photo 12) and the browser back button works.

## Running locally

No build step — just serve the folder and open it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Playground

The "playground" tab works the same way: an overview listing the toys, each opening its own page with a way back. Every toy has its own URL (`#playground/colors`, `#playground/photobooth`, `#playground/paint`). Adding one means another `.page` with `data-mode="detail"`, a `data-toy` and a matching `data-item`, plus a card on the overview whose `data-jump` matches.

Each toy card can carry a drawing at `images/toys/<toy>.png` (transparent background, cropped tight to the drawing). Keep the filenames lowercase: GitHub Pages is case-sensitive, so `colors.PNG` works on Windows but 404s once deployed. If the file isn't there the slot removes itself and the card falls back to text, so cards without art still look right.

### Photobooth

Takes webcam shots on a countdown and prints them onto a strip you can save as a PNG. The camera is drawn onto a canvas rather than shown directly, so the funhouse mirrors bend the live view exactly the way they bend the photo, and the view is mirrored like a real booth. Nothing leaves the browser.

Two tabs, two kinds of filter, picked at different times:

- **shoot** — layout (1×3, 1×4, 2×2, 2×3, 1×1), timer (3 / 5 / 10 s), and how to shoot: **all at once** (mirrors are locked for the run) or **one at a time** (pauses after each shot, and *only then* can the mirror change). The filter row here holds only the **mirrors**: normal, wavy, fisheye, pinch, wide, tall, twins.
- **edit** — you land here automatically when the strip is finished. The filter row now holds only the **colours** (as is, b&w, sepia, dreamy): they change the picked photo, or every photo if none is picked. Also: paper, a background photo you upload (then crop, zoom and rotate it), a caption (up to 24 characters, optional) and the date (also optional), an "add ☺" smiley you place on the strip, and retake for the picked photo. The camera view is hidden while you edit.

The camera has a single button that says what it will do (turn on / turn off), and "take photos" and "retake" switch it on themselves if it's off. Each shot is stored as the raw camera frame plus its look (a colour and maybe a mirror), and the strip is re-rendered from those, which is what makes editing afterwards possible.

Four tables near the top of the photobooth section drive it, each extended by adding a row: `BOOTH_LAYOUTS`, `BOOTH_FILTERS` (`css` is a plain colour filter, `warp` bends the picture), `BOOTH_PAPERS` and `BOOTH_TIMERS`. The smiley is the handwriting font's own ☺ (the font has no music note, which is why there isn't one).

### Paint

A replica of the classic Windows 98 Paint, in `paint.js` + `paint.css`: title bar, menu bar (File / Edit / View / Image / Colors / Help, with working menus and submenus), the 16-tool toolbox with its tool-options box, the 28-colour palette with foreground / background colours, a workspace with draggable canvas-resize handles, and a status bar. Tools: free-form select, select, eraser / colour eraser, fill, pick colour, magnifier, pencil, brush (12 shapes and sizes), airbrush, text, line, curve, rectangle, polygon, ellipse, rounded rectangle. Also: undo / repeat, cut / copy / paste (including from the system clipboard), flip / rotate, stretch / skew, invert, attributes, grid and thumbnail when zoomed, and open / save as PNG. Shapes follow the classic outline / filled / both styles; Shift constrains them. The tool icons were redrawn from memory.

## On phones

The layout changes at three points, and there is no swipe-to-turn anywhere (it fights with drawing and scrolling), so the prev / next links at the foot of every page are the way to turn pages.

- **Up to 760px wide** — the divider tabs run across the top, on one line. Controls are 36–46px tall with 16px text in inputs (smaller makes iOS Safari zoom the page in), hover effects only apply on devices that can hover, and buttons sink when pressed. The photobooth's controls collapse to a row of section buttons so the camera and strip keep room.
- **Under about 600px tall** — the same section buttons appear on the booth's shoot tab, and everything gets a notch tighter.
- **Under 480px tall (a phone held sideways)** — the notebook goes two-column: the index lists beside its title, about puts the truths in their own column, and the booth keeps its controls on the left with the camera and strip on the right.

Anything with the `hidden` attribute stays hidden whatever `display` its class sets (`[hidden] { display: none !important; }`), because the phone styles give many buttons `display: inline-flex`.

## Color analysis tool

The "colors" tab lets you upload a photo or use your webcam, then drapes a ring of color swatches around your face so you can try on different palettes.

- **Face detection** runs entirely in the browser via [face-api.js](https://github.com/justadudewhohacks/face-api.js) (loaded lazily from a CDN only when you open the tab), so nothing is ever uploaded anywhere.
- **Webcam mode** tracks your face live and eases the ring toward it every frame for smooth motion; dragging the ring or resizing it pauses tracking so you can fine-tune, with a button to resume.
- If detection fails or is off, the ring can always be dragged, resized, and rotated by hand.
- **Palettes** are the 12-season personal color analysis system professional colorists use (Light/Warm/Bright Spring, Light/Cool/Soft Summer, Soft/Warm/Deep Autumn, Deep/Cool/Bright Winter).

Since detection depends on a third-party CDN, if it's ever unreachable the tool just falls back to manual placement instead of breaking.

## Deployment

Pushes to `main` publish automatically via GitHub Pages.
