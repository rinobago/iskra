const form = document.getElementById("contact-form");

if (form) {
    const button = form.querySelector(".contact-submit");
    const label = button.querySelector("[data-submit-label]");
    const status = document.getElementById("contact-form-status");
    const isEnglish = document.documentElement.lang === "en";
    const idleLabel = label.textContent.trim();
    const labels = isEnglish
        ? { loading: "Preparing…", prepared: "Inquiry prepared", retry: "Try again" }
        : { loading: "Priprema…", prepared: "Upit pripremljen", retry: "Pokušajte ponovno" };

    function setState(state) {
        button.dataset.state = state;
        button.disabled = state !== "idle";
        button.setAttribute("aria-busy", String(state === "loading"));
        label.textContent = labels[state] || idleLabel;
    }

    function resetState() {
        if (button.dataset.state === "loading") return;
        setState("idle");
        status.hidden = true;
    }

    form.addEventListener("input", resetState);
    form.addEventListener("reset", resetState);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (button.disabled || !form.reportValidity()) return;

        const data = new FormData(form);
        const name = data.get("name").trim();
        const email = data.get("email").trim();
        const service = data.get("service");
        const message = data.get("message").trim();
        const subject = `${isEnglish ? "Project inquiry" : "Upit za projekt"}: ${service}`;
        const body = isEnglish
            ? `Full name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`
            : `Ime i prezime: ${name}\nE-pošta: ${email}\nUsluga: ${service}\n\n${message}`;

        status.hidden = true;
        setState("loading");

        // Let the browser paint the loading state before handing off to the email app.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        try {
            window.location.href = `mailto:hello@byiskra.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            // A mailto handoff cannot confirm delivery. Mark this as sent only after
            // the future email endpoint confirms a successful submission.
            setState("prepared");
        } catch {
            setState("idle");
            label.textContent = labels.retry;
        }

        status.hidden = false;
    });
}
