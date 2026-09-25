// Preserve the site's safe area and pinch zoom when the embed adds a viewport tag.
const siteViewport = document.getElementById("site-viewport");
function preserveViewport() {
  document.querySelectorAll('meta[name="viewport"]').forEach((meta) => {
    if (siteViewport && meta !== siteViewport) meta.remove();
  });
}
preserveViewport();
new MutationObserver(preserveViewport).observe(document.head, { childList: true });

// CharityStack replaces these placeholders with lazy iframes. Start both now,
// without changing their URLs, payment permissions, or message handling.
const pendingEmbeds = new Set([
  "7f98ee6f-262f-4263-ba45-ddbd899ed38c",
  "ddabb69a-a264-4677-8bad-614bcc5e8f09",
]);
function startEmbeds() {
  for (const id of pendingEmbeds) {
    const frame = document.getElementById(id);
    if (frame?.tagName !== "IFRAME") continue;
    frame.loading = "eager";
    pendingEmbeds.delete(id);
  }
  if (!pendingEmbeds.size) embedObserver.disconnect();
}
const embedObserver = new MutationObserver(startEmbeds);
embedObserver.observe(document.getElementById("support"), { childList: true, subtree: true });
startEmbeds();

// Give upcoming images a head start, retaining native lazy loading without JS.
// Decode before a short fade; no blocking splash screen or perpetual shimmer.
if ("IntersectionObserver" in window) {
  const upcoming = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const image = entry.target;
      upcoming.unobserve(image);
      image.loading = "eager";
      if (image.complete && image.naturalWidth) continue;
      image.classList.add("image-pending");
      const reveal = () => image.classList.remove("image-pending");
      image.decode().then(reveal, reveal);
    }
  }, { rootMargin: "100% 0px" });
  document.querySelectorAll('main img[loading="lazy"]:not([data-src])').forEach((image) => upcoming.observe(image));
}
