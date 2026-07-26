const FORM_ID = "ddabb69a-a264-4677-8bad-614bcc5e8f09";

function showDonationForm() {
  const support = document.getElementById("support");
  const header = document.querySelector("[data-header]");

  if (!support) return;

  window.history.replaceState(null, "", "#support");

  const headerOffset = header?.offsetHeight || 0;
  const top = support.getBoundingClientRect().top + window.scrollY - headerOffset - 20;

  window.scrollTo({ top, behavior: "smooth" });
}

function setupDonationButtons() {
  document.querySelectorAll("[data-donate]").forEach((button) => {
    button.addEventListener("click", showDonationForm);
  });
}

function setupDonationDeepLink() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("donate") || params.has("formid")) {
    window.setTimeout(showDonationForm, 450);
  }
}

function setupHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function setupReveal() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  elements.forEach((element) => observer.observe(element));
}

function setupProcessSteps() {
  const process = document.querySelector("[data-process]");
  const copy = document.querySelector("[data-process-copy]");
  if (!process || !copy) return;

  const buttons = Array.from(process.querySelectorAll("button"));
  const activate = (button) => {
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    copy.textContent = button.dataset.copy || "";
  };

  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => activate(button));
    button.addEventListener("focus", () => activate(button));
    button.addEventListener("click", () => activate(button));
  });

  if (buttons[0]) activate(buttons[0]);
}

function setupImageLightbox() {
  const dialog = document.querySelector("[data-image-lightbox]");
  const image = dialog?.querySelector("[data-lightbox-image]");
  const close = dialog?.querySelector("[data-lightbox-close]");

  if (!dialog || !image || !close || typeof dialog.showModal !== "function") return;

  document.querySelectorAll("[data-lightbox-src]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      image.src = trigger.dataset.lightboxSrc || "";
      image.alt = trigger.dataset.lightboxAlt || "";
      dialog.showModal();
    });
  });

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

setupDonationButtons();
setupDonationDeepLink();
setupHeader();
setupReveal();
setupProcessSteps();
setupImageLightbox();
