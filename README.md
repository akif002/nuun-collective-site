# Nuun Collective Static Site

This is a no-build static landing page for Nuun Collective.

## Local Preview

```bash
cd /Users/akif/Sites/nuun-collective-site
python3 -m http.server 4173
```

Open:

```txt
http://localhost:4173
```

## Recommended Hosting: Cloudflare Pages

Cloudflare Pages is the best fit for this version because the site is static, has no build step, and should be fast globally.

1. Create a GitHub repo and upload these files.
2. In Cloudflare, go to **Workers & Pages → Create → Pages**.
3. Connect the GitHub repo.
4. Set the build settings:
   - Framework preset: `None`
   - Build command: leave blank
   - Build output directory: `/`
5. Deploy.
6. Add a custom domain in **Pages → Custom domains** if needed.

## Other Hosting Options

- **Netlify:** drag-and-drop the folder or connect the repo. No build command needed.
- **Vercel:** import the repo as a static project. No build command needed.
- **AWS S3 + CloudFront:** upload files to S3 static hosting and place CloudFront in front for HTTPS and caching.
- **GitHub Pages:** works for a simple free deployment, but Cloudflare Pages is recommended for production polish.

## Donation Integration

The CharityStack embed script is included once in `index.html`. Donation buttons call `window.CharityStack.openOverlay("ddabb69a-a264-4677-8bad-614bcc5e8f09")` and fall back to the Nuun donation URL if the overlay API is unavailable.
