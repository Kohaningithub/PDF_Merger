# PDF Merge & Arrange

Merge and reorder PDFs directly in your browser. Private, fast, and simple — no uploads.

## Live site
`https://kohaningithub.github.io/PDF_Merger/`

If the page returns 404 after a fresh push, wait ~1–2 minutes and refresh. Ensure GitHub Pages is enabled for the repository (Settings → Pages → Deploy from a branch → main /(root)).

## Features
- **Add PDFs**: Drag & drop or use the file picker
- **Reorder**: Drag the handle to change order
- **Select pages**: Per-file page ranges (e.g., `1-3,5,7-`)
- **One‑click merge**: Download the result instantly
- **Private**: 100% client-side with [pdf-lib](https://www.npmjs.com/package/pdf-lib)

## Quick start
1) Local use
- Open `index.html` in Chrome, Edge, or Firefox.
- Drag in PDFs, reorder as needed.
- Optionally enter page ranges using 1‑based pages:
  - Single page: `5`
  - Range: `2-6`
  - From start: `-3` (pages 1 to 3)
  - To end: `10-` (page 10 to last)
- Click “Merge PDFs” to download.

2) Deploy to GitHub Pages
- Push the files to your repo root (`main` branch).
- In GitHub: `Settings` → `Pages` → `Deploy from a branch` → Branch: `main`, Folder: `/ (root)`.
- Your site will be available at `https://<username>.github.io/<repo-name>/`.

## Privacy
All processing happens locally in your browser; files never leave your device. Works offline once loaded.

## Tech
- [pdf-lib](https://github.com/Hopding/pdf-lib) for PDF manipulation
- Vanilla HTML/CSS/JS (no build step)

## License
MIT



