export function initNavbar() {
    let lastScrollY = window.scrollY;

    const navbar = document.querySelector(".website-navbar");
    if (!navbar) return;

    window.addEventListener("scroll", () => {
        if (document.body.classList.contains("mobile-nav-open")) {
            navbar.classList.remove("navbar-hidden");
            lastScrollY = window.scrollY;
            return;
        }

        const currentScrollY = window.scrollY;

        if (currentScrollY > 80) {
            navbar.classList.add("bg-surface");
        } else {
            navbar.classList.remove("bg-surface");
        }

        if (currentScrollY < 80) {
            navbar.classList.remove("navbar-hidden");
        } else if (currentScrollY > lastScrollY) {
            // Scrolling down
            navbar.classList.add("navbar-hidden");
        } else {
            // Scrolling up
            navbar.classList.remove("navbar-hidden");
        }

        lastScrollY = currentScrollY;
    });
}
