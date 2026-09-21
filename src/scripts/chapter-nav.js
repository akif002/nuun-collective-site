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
