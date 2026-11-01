const form = document.getElementById("contact-form");

form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = data.get("name").trim();
    const email = data.get("email").trim();
    const service = data.get("service");
    const message = data.get("message").trim();
    const subject = `Upit za projekt: ${service}`;
    const body = `Ime i prezime: ${name}\nE-pošta: ${email}\nUsluga: ${service}\n\n${message}`;

    window.location.href = `mailto:hello@byiskra.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById("contact-form-status").hidden = false;
});
