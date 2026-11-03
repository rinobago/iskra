const form = document.getElementById("contact-form");

if (form) {
    const button = form.querySelector(".contact-submit");
    const label = button.querySelector("[data-submit-label]");
    const status = document.getElementById("contact-form-status");
    const fields = [...form.querySelectorAll("input, select, textarea")];
    const language = document.documentElement.lang === "en" ? "en" : "hr";
    const idleLabel = label.textContent.trim();
    const text =
        language === "en"
            ? {
                  loading: "Sending…",
                  success: "Inquiry sent",
                  error: "Try again",
                  sent: "Thank you! Your inquiry has been sent. Look out for a confirmation email — we'll be in touch very soon.",
                  failed: "We couldn't confirm your submission. Please try again or email hello@byiskra.com directly.",
                  invalid: "Please check all required fields and enter a valid email address.",
                  limited:
                      "You've made several attempts. Please wait a minute before trying again.",
                  required: "Please fill out this field.",
              }
            : {
                  loading: "Slanje…",
                  success: "Upit je poslan",
                  error: "Pokušajte ponovno",
                  sent: "Hvala! Vaš je upit poslan. Potvrda stiže na vašu e-poštu — javit ćemo vam se vrlo brzo.",
                  failed: "Nismo uspjeli potvrditi slanje upita. Pokušajte ponovno ili nam pišite izravno na hello@byiskra.com.",
                  invalid: "Provjerite sva obvezna polja i unesite valjanu adresu e-pošte.",
                  limited: "Poslali ste više zahtjeva. Pričekajte minutu pa pokušajte ponovno.",
                  required: "Ispunite ovo polje.",
              };
    let lastPayload;
    let submissionId;

    function setState(state, message = "") {
        button.dataset.state = state;
        button.disabled = state === "loading" || state === "success";
        form.setAttribute("aria-busy", String(state === "loading"));
        label.textContent = text[state] || idleLabel;
        status.textContent = message;
        status.hidden = !message;
    }

    form.addEventListener("input", (event) => {
        event.target.setCustomValidity?.("");
        if (button.dataset.state !== "loading") setState("idle");
    });
    form.addEventListener("change", () => {
        if (button.dataset.state !== "loading") setState("idle");
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (button.disabled) return;
        for (const field of fields) {
            if (field.required) {
                field.value = field.value.trim();
                field.setCustomValidity(field.value ? "" : text.required);
            }
        }
        if (!form.reportValidity()) return;

        const data = Object.fromEntries(new FormData(form));
        data.language = language;
        const payload = JSON.stringify(data);
        if (payload !== lastPayload) {
            submissionId = crypto.randomUUID();
            lastPayload = payload;
        }
        data.submissionId = submissionId;
        setState("loading");
        fields.forEach((field) => {
            field.disabled = true;
        });

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(20000),
            });
            const result = await response.json();
            if (!response.ok || result.success !== true) {
                const message =
                    result.code === "RATE_LIMITED"
                        ? text.limited
                        : result.code === "INVALID_INPUT"
                          ? text.invalid
                          : text.failed;
                setState("error", message);
                return;
            }
            form.reset();
            lastPayload = undefined;
            setState("success", text.sent);
        } catch {
            setState("error", text.failed);
        } finally {
            fields.forEach((field) => {
                field.disabled = false;
            });
        }
    });

    // The HTML button stays disabled if JavaScript cannot initialize.
    setState("idle");
}
