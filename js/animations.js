gsap.registerPlugin(ScrollTrigger);

const fadeUpElements = gsap.utils.toArray("[data-animate='fade-up']");

const mm = gsap.matchMedia();

mm.add("(min-width: 1024px)", () => {
    const navbar = document.querySelector("[data-animate='navbar']");
    const heroElements = gsap.utils.toArray("[data-animate='hero']");

    if (!navbar) return;

    const navbarItems = [...navbar.querySelectorAll("li"), navbar.querySelector("div")].filter(
        Boolean,
    );

    const introTimeline = gsap.timeline();

    introTimeline.from(navbarItems, {
        opacity: 0,
        y: 15,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.06,
    });

    if (heroElements.length >= 2) {
        const heroText = heroElements[0];
        const heroImage = heroElements[1];

        introTimeline
            .from(
                heroText,
                {
                    opacity: 0,
                    y: 20,
                    duration: 0.85,
                    ease: "power3.out",
                },
                "-=0.55",
            )
            .from(
                heroImage,
                {
                    opacity: 0,
                    rotateY: 35,
                    duration: 2,
                    ease: "power3.out",
                },
                "<+=0.4",
            );
    }
});

mm.add("(max-width: 1023px)", () => {
    const heroElements = gsap.utils.toArray("[data-animate='hero']");

    if (!heroElements.length) return;

    const heroText = heroElements[0];
    const heroImage = heroElements[1];

    const heroTimeline = gsap.timeline({
        delay: 0.25,
    });

    heroTimeline
        .from(heroText, {
            opacity: 0,
            y: 20,
            duration: 0.85,
            ease: "power3.out",
        })
        .from(
            heroImage,
            {
                opacity: 0,
                rotateY: 35,
                duration: 2,
                ease: "power3.out",
            },
            "<+=0.3",
        );
});

if (fadeUpElements.length) {
    fadeUpElements.forEach((element, index) => {
        gsap.from(element, {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
                once: true,
            },
        });
    });
}
