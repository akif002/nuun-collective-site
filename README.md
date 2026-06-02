# Nuun Collective Site

This is an Astro-powered landing page for Nuun Collective. The site stays mostly static for speed,
while giving the project a component-friendly foundation for future pages, content, and animation.

## Local Preview

```bash
cd /Users/akif/Sites/nuun-collective-site
npm install
npm run dev
```

Open:

```txt
http://localhost:4321
```

## Recommended Hosting: Cloudflare Pages

Cloudflare Pages is a strong fit because Astro builds this site to static HTML/CSS/JS.

1. Create a GitHub repo and upload these files.
2. In Cloudflare, go to **Workers & Pages → Create → Pages**.
3. Connect the GitHub repo.
4. Set the build settings:
   - Framework preset: `Astro`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy.
6. Add a custom domain in **Pages → Custom domains** if needed.

## Other Hosting Options

- **Netlify:** connect the repo with build command `npm run build` and publish directory `dist`.
- **Vercel:** import the repo as an Astro project.
- **AWS S3 + CloudFront:** run `npm run build`, upload `dist/` to S3 static hosting, and place CloudFront in front for HTTPS and caching.
- **GitHub Pages:** works if configured to deploy the generated `dist/` output.

## Donation Integration

The CharityStack embed script is included once in `src/pages/index.astro`. Donation buttons call `window.CharityStack.openOverlay("ddabb69a-a264-4677-8bad-614bcc5e8f09")` and fall back to the Nuun donation URL if the overlay API is unavailable.
