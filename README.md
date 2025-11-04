# PDF Merge & Arrange (Client‑Only)

Fast, simple, and private PDF merging and arranging in your browser. No uploads, no accounts, just drag, drop, reorder, and merge.

## Features
- Add multiple PDFs (drag & drop or file picker)
- Reorder files via drag handle
- Optional page selection per file (e.g., `1-3,5,7-`)
- One-click merge and download
- 100% client-side using [pdf-lib](https://www.npmjs.com/package/pdf-lib)

## Usage
- Open `index.html` in your browser, or deploy to GitHub Pages (below).
- Add PDFs, optionally type page ranges using 1-based pages:
  - Single page: `5`
  - Range: `2-6`
  - From start: `-3` (pages 1 to 3)
  - To end: `10-` (page 10 to last)
- Click "Merge PDFs".

## Deploy on GitHub Pages
1. Create a new GitHub repository (public or private).
2. Add these files to the repo root:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. Commit and push to `main` (or `master`).
4. In repo Settings → Pages:
   - Source: "Deploy from a branch"
   - Branch: `main` and folder `/ (root)`
5. Save. Your site will be available at `https://<your-username>.github.io/<repo-name>/`.

No build step is required; it's a pure static site.

## Privacy
All processing happens in your browser. Files never leave your device.

## Tech
- [pdf-lib](https://github.com/Hopding/pdf-lib) for PDF manipulation
- Vanilla HTML/CSS/JS, no frameworks

## License
MIT



