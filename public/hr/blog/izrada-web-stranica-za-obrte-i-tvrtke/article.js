import { initMobileNav } from "/js/mobileNav.js";
import { initNavbar } from "/js/navbar.js";

initNavbar();
initMobileNav();

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const article = document.querySelector("#article-body");
const progress = document.querySelector(".reading-progress");
const fill = document.querySelector(".reading-progress-fill");
const links = [...document.querySelectorAll(".article-contents nav a")];
const headings = links.map((link) => document.getElementById(link.hash.slice(1)));
const contents = document.querySelector(".article-contents");
const mobile = matchMedia("(max-width: 800px)");
let frame = 0;

function updateReading() {
    frame = 0;
    const rect = article.getBoundingClientRect();
    // Start as the article reaches the reading line; finish as its last line
    // enters the viewport. Hero, CTA, related articles and footer are excluded.
    const readingLine = Math.min(160, innerHeight * 0.22);
    const distance = Math.max(1, rect.height - innerHeight + readingLine);
    const value = Math.min(1, Math.max(0, (readingLine - rect.top) / distance));
    fill.style.transform = `scaleX(${value})`;
    progress.setAttribute("aria-valuenow", String(Math.round(value * 100)));
    let active = 0;
    headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= readingLine + 24) active = index;
    });
    links.forEach((link, index) => {
        if (index === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
    });
}
function scheduleReading() {
    if (!frame) frame = requestAnimationFrame(updateReading);
}
function updateContents() {
    contents.open = !mobile.matches;
}
updateContents();
mobile.addEventListener("change", updateContents);
links.forEach((link) =>
    link.addEventListener("click", () => {
        if (mobile.matches) contents.open = false;
    }),
);
addEventListener("scroll", scheduleReading, { passive: true });
addEventListener("resize", scheduleReading);
addEventListener("load", scheduleReading);
new ResizeObserver(scheduleReading).observe(article);
document.fonts.ready.then(scheduleReading);
updateReading();

const copyButton = document.querySelector("#copy-article");
let shareStatusTimeout;
copyButton.hidden = false;
copyButton.addEventListener("click", async () => {
    const url = document.querySelector('link[rel="canonical"]').href;
    const status = document.querySelector("#share-status");
    try {
        await navigator.clipboard.writeText(url);
        status.textContent = "Poveznica je kopirana.";
    } catch {
        status.textContent = `Kopirajte poveznicu: ${url}`;
    }
    clearTimeout(shareStatusTimeout);
    shareStatusTimeout = setTimeout(() => {
        status.textContent = "";
    }, 3000);
});

const carousel = document.querySelector("#blog-carousel");
const previous = document.querySelector('[data-carousel="previous"]');
const next = document.querySelector('[data-carousel="next"]');
function updateCarousel() {
    previous.disabled = carousel.scrollLeft <= 2;
    next.disabled = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 2;
}
function moveCarousel(direction) {
    const card = carousel.querySelector(".blog-preview");
    const gap = parseFloat(getComputedStyle(carousel).columnGap);
    carousel.scrollBy({
        left: direction * (card.getBoundingClientRect().width + gap),
        behavior: reducedMotion.matches ? "instant" : "smooth",
    });
}
previous.addEventListener("click", () => moveCarousel(-1));
next.addEventListener("click", () => moveCarousel(1));
carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveCarousel(event.key === "ArrowRight" ? 1 : -1);
    }
});
carousel.addEventListener("scroll", updateCarousel, { passive: true });
new ResizeObserver(updateCarousel).observe(carousel);
updateCarousel();

// Reuse the shared navigation, with local keyboard and state improvements.
const navToggle = document.querySelector("#navToggle");
const sideNav = document.querySelector("#sideNav");
navToggle.setAttribute("aria-controls", "sideNav");
navToggle.setAttribute("aria-expanded", "false");
function syncNavState() {
    const open = sideNav.classList.contains("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Zatvori navigaciju" : "Otvori navigaciju");
}
new MutationObserver(syncNavState).observe(sideNav, {
    attributes: true,
    attributeFilter: ["class"],
});
addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sideNav.classList.contains("is-open")) {
        navToggle.click();
        navToggle.focus();
    }
});

if (!reducedMotion.matches) {
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.animate(
                    [
                        { opacity: 0.45, transform: "translateY(14px)" },
                        { opacity: 1, transform: "translateY(0)" },
                    ],
                    { duration: 500, easing: "ease-out" },
                );
                observer.unobserve(entry.target);
            }
        },
        { threshold: 0.15 },
    );
    document.querySelectorAll(".article-cta").forEach((element) => observer.observe(element));
}
