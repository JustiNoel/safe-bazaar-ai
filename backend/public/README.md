Place your site logo and favicon here.

- `logo.png` — main logo used by any simple HTML page or previews.
- `favicon.ico` — browser tab favicon (recommended: 32x32 or 48x48 ICO file).

To use the logo as the browser favicon:
1. Convert your PNG/JPG logo to `favicon.ico` (many online tools or image editors can do this).
2. Copy both `logo.png` and `favicon.ico` into this `public/` folder.
3. The backend serves static files from `/public`, so `http://<host>:<port>/favicon.ico` will return the favicon.

Example: `http://localhost:5000/favicon.ico`

If you want the logo shown on the root HTML page, create `public/index.html` that references `/logo.png`.
