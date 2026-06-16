# Watify Landing Page

This folder is intentionally separate from the main React/Express/PostgreSQL project.

Open `index.html` directly in a browser, or serve the folder with any static server:

```powershell
cd D:\watify_local\Watify\landing-page
python -m http.server 8080
```

Then visit `http://localhost:8080`.

The page is a standalone client-facing landing page with:

- A white hero card that reveals a dashboard mock on hover.
- Interactive feature cards that simulate core Watify actions.
- A simple workflow section explaining the product journey.
- No backend or React dependency.
