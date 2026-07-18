export function initMobileNav() {
    const navToggle = document.getElementById("navToggle");
    const sideNav = document.getElementById("sideNav");

    if (!navToggle || !sideNav) return;

    const sideNavLinks = sideNav.querySelectorAll("li");

    function openSideNav() {
        sideNav.classList.add("is-open");
        document.body.style.overflow = "hidden";
        document.body.classList.add("mobile-nav-open");
    }

    function closeSideNav() {
        sideNav.classList.remove("is-open");
        document.body.style.overflow = "";
        document.body.classList.remove("mobile-nav-open");
    }

    navToggle.addEventListener("click", () => {
        if (sideNav.classList.contains("is-open")) {
            closeSideNav();
        } else {
            openSideNav();
        }
    });

    sideNavLinks.forEach((item) => {
        item.addEventListener("click", closeSideNav);
    });
}
