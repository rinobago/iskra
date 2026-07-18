export function initTiltCards() {
    const cards = document.querySelectorAll(".tilt-card");

    cards.forEach((card) => {
        card.addEventListener("mousemove", (event) => {
            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.setProperty("--rotate-x", `${rotateX}deg`);
            card.style.setProperty("--rotate-y", `${rotateY}deg`);
        });

        card.addEventListener("mouseleave", () => {
            card.style.setProperty("--rotate-x", "0deg");
            card.style.setProperty("--rotate-y", "0deg");
        });
    });
}
