const FORM_ID = "ddabb69a-a264-4677-8bad-614bcc5e8f09";
const FALLBACK_DONATION_URL =
  "https://www.nuuncollective.com?donate&formid=ddabb69a-a264-4677-8bad-614bcc5e8f09";

function openDonationOverlay() {
  if (typeof window !== "undefined" && window.CharityStack?.openOverlay) {
    window.CharityStack.openOverlay(FORM_ID);
    return;
  }

  window.location.href = FALLBACK_DONATION_URL;
}

function setupDonationButtons() {
  document.querySelectorAll("[data-donate]").forEach((button) => {
    button.addEventListener("click", openDonationOverlay);
  });
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

setupDonationButtons();
setupHeader();
setupReveal();
setupProcessSteps();
