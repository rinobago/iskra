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

    // Hide the items before revealing their CSS-hidden parent.
    gsap.set(navbarItems, { autoAlpha: 0, y: 15 });
    gsap.set(navbar, { autoAlpha: 1 });

    const introTimeline = gsap.timeline({ paused: true, delay: 0.25 });

    introTimeline.to(navbarItems, {
        autoAlpha: 1,
        y: 0,
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
                    autoAlpha: 0,
                    y: 20,
                    duration: 0.85,
                    ease: "power3.out",
                },
                "-=0.55",
            )
            .from(
                heroImage,
                {
                    autoAlpha: 0,
                    rotateY: 35,
                    duration: 2,
                    ease: "power3.out",
                },
                "<+=0.4",
            );
    }

    let fontsReady = false;
    let disposed = false;
    let started = false;
    let startFrame;

    const playIntro = () => {
        if (disposed || started || !fontsReady || document.readyState !== "complete") return;
        if (document.hidden) return;

        cancelAnimationFrame(startFrame);
        startFrame = requestAnimationFrame(() => {
            if (disposed || document.hidden) return;
            started = true;
            introTimeline.play();
        });
    };

    window.addEventListener("load", playIntro);
    document.addEventListener("visibilitychange", playIntro);
    document.fonts.ready.then(() => {
        fontsReady = true;
        playIntro();
    });

    return () => {
        disposed = true;
        cancelAnimationFrame(startFrame);
        window.removeEventListener("load", playIntro);
        document.removeEventListener("visibilitychange", playIntro);
    };
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
            autoAlpha: 0,
            y: 20,
            duration: 0.85,
            ease: "power3.out",
        })
        .from(
            heroImage,
            {
                autoAlpha: 0,
                rotateY: 35,
                duration: 2,
                ease: "power3.out",
            },
            "<+=0.3",
        );
});

if (fadeUpElements.length) {
    fadeUpElements.forEach((element) => {
        const animation = gsap.fromTo(
            element,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 85%",
                    once: true,
                },
            },
        );

        element.addEventListener("focusin", () => {
            animation.scrollTrigger?.kill();
            animation.progress(1).pause();
        });
    });
}
