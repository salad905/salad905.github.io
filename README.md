# salad905.github.io

My personal website, about me, resume, projects, a photo gallery, and a personal color analysis tool. Plain HTML/CSS/JS, no build step, hosted on GitHub Pages.

## Structure

- `index.html` — all page markup, one `<div class="tab-section">` per tab (about / resume / projects / gallery / colors)
- `style.css` — all styling
- `script.js` — all behavior (tab switching, project/gallery data + rendering, color analysis tool)
- `images/` — photos and icons used across the site

## Running locally

No build step — just serve the folder and open it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Color analysis tool

The "colors" tab lets you upload a photo or use your webcam, then drapes a ring of color swatches around your face so you can try on different palettes.

- **Face detection** runs entirely in the browser via [face-api.js](https://github.com/justadudewhohacks/face-api.js) (loaded lazily from a CDN only when you open the tab), so nothing is ever uploaded anywhere.
- **Webcam mode** tracks your face live and eases the ring toward it every frame for smooth motion; dragging the ring or resizing it pauses tracking so you can fine-tune, with a button to resume.
- If detection fails or is off, the ring can always be dragged, resized, and rotated by hand.
- **Palettes** are the 12-season personal color analysis system professional colorists use (Light/Warm/Bright Spring, Light/Cool/Soft Summer, Soft/Warm/Deep Autumn, Deep/Cool/Bright Winter).

Since detection depends on a third-party CDN, if it's ever unreachable the tool just falls back to manual placement instead of breaking.

## Deployment

Pushes to `main` publish automatically via GitHub Pages.
