const links = [...document.querySelectorAll('[data-chapter]')];
if (links.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const current = entries.find((entry) => entry.isIntersecting);
    if (!current) return;
    links.forEach((link) => {
      if (link.dataset.chapter === current.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  links.forEach((link) => {
    const section = document.getElementById(link.dataset.chapter);
    if (section) observer.observe(section);
  });
}

// Animate once on entry without hiding content while scripts or images load.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  const running = new Set();
  const entrances = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entrances.unobserve(entry.target);
      if (motionPreference.matches) return;
      const animation = entry.target.animate([
        { opacity: 0.35, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      running.add(animation);
      animation.onfinish = () => running.delete(animation);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.chapter-heading h2, .editorial-heading, .problem-copy, .scripture-card, .writing-stack a, .channel-grid a, .support-copy').forEach((element) => entrances.observe(element));
  motionPreference.addEventListener('change', (event) => {
    if (!event.matches) return;
    entrances.disconnect();
    running.forEach((animation) => animation.cancel());
    running.clear();
  });
}
