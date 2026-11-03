const inbox = "hello@byiskra.com";
const from = `Iskra <${inbox}>`;

export const services = {
    website: { hr: "Izrada web stranice", en: "Website development" },
    redesign: { hr: "Redizajn web stranice", en: "Website redesign" },
    maintenance: { hr: "Održavanje web stranice", en: "Website maintenance" },
    seo: { hr: "SEO optimizacija", en: "SEO optimization" },
    identity: { hr: "Vizualni identitet", en: "Visual identity" },
    other: { hr: "Nešto drugo", en: "Something else" },
};

const inquiryCopy = {
    inquiry: "New project inquiry",
    intro: "A new idea just landed. Here are all the details from the contact form.",
    name: "Full name",
    email: "Email",
    service: "Service",
    message: "About the project",
    reply: "Reply to this email to get in touch with the sender directly.",
};

const copy = {
    hr: {
        subject: "Hvala na upitu — javimo se uskoro! | Iskra",
        heading: "Dobre ideje počinju razgovorom.",
        greeting: "Pozdrav",
        thanks: "Hvala što ste se javili Iskri i podijelili svoju ideju s nama.",
        promise:
            "Vaš je upit stigao do nas. Pregledat ćemo detalje i javiti vam se u najkraćem mogućem roku — veselimo se razgovoru o vašem projektu!",
        extra: "Želite li nešto dodati? Samo odgovorite na ovu poruku i sve će stići izravno nama.",
        signoff: "Do skorog javljanja,",
        team: "Tim Iskra",
        footer: "Ovu potvrdu primate jer je vaša adresa navedena u kontaktnom obrascu na byiskra.com. Ako niste poslali upit, ovu poruku možete zanemariti.",
    },
    en: {
        subject: "Thanks for reaching out — we'll be in touch soon! | Iskra",
        heading: "Good ideas start with a conversation.",
        greeting: "Hi",
        thanks: "Thank you for reaching out to Iskra and sharing your idea with us.",
        promise:
            "Your inquiry has reached us. We'll take a look at the details and get back to you as quickly as possible — we're looking forward to talking about your project!",
        extra: "Have anything to add? Just reply to this email and it will come straight to us.",
        signoff: "Talk soon,",
        team: "The Iskra team",
        footer: "You received this confirmation because your email address was entered in the contact form at byiskra.com. If you did not submit an inquiry, you can ignore this email.",
    },
};

function escapeHtml(value) {
    return value.replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[char],
    );
}

function paragraph(text) {
    return `<p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#27272a;overflow-wrap:anywhere;">${escapeHtml(text)}</p>`;
}

function detail(label, value) {
    return `<tr><td style="padding:12px 20px;overflow-wrap:anywhere;word-break:break-word;">
        <p style="margin:0 0 4px;font-size:13px;color:#52525b;">${escapeHtml(label)}</p>
        <p style="margin:0;font-size:16px;line-height:1.7;color:#18181b;">${escapeHtml(value).replace(/\r\n|\r|\n/g, "<br />")}</p>
    </td></tr>`;
}

function frame(language, title, preview, content, footer) {
    return `<!doctype html>
<html lang="${language}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(title)}</title>
<style>
/* A solid gradient helps preserve this brand color in Gmail dark mode.
   Outlook variants that expose dark-mode attributes get the same override. */
@media (prefers-color-scheme: dark) {
    .email-brand-header { background-color:#18181b !important; background-image:linear-gradient(#18181b,#18181b) !important; }
}
[data-ogsb] .email-brand-header,
[data-ogsc] .email-brand-header { background-color:#18181b !important; background-image:linear-gradient(#18181b,#18181b) !important; }
</style></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;">
<tr><td class="email-brand-header" bgcolor="#18181b" style="padding:28px;background-color:#18181b;background-image:linear-gradient(#18181b,#18181b);"><a href="https://byiskra.com/${language}/" style="color:#ff6a00;text-decoration:none;"><img src="https://byiskra.com/assets/images/IskraLogo.png" alt="Iskra" width="48" height="64" style="display:block;width:48px;height:64px;border:0;" /></a></td></tr>
<tr><td style="padding:32px 28px;">
<h1 style="margin:0 0 24px;font-size:28px;line-height:1.25;color:#18181b;">${escapeHtml(title)}</h1>
${content}
</td></tr>
<tr><td style="padding:24px 28px;background:#f0f0f1;">
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;"><a href="mailto:${inbox}" style="color:#18181b;">${inbox}</a> &nbsp;·&nbsp; <a href="https://byiskra.com/${language}/" style="color:#18181b;">byiskra.com</a></p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#52525b;">${escapeHtml(footer)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function createContactEmails({ name, email, service, message, language }) {
    const t = copy[language];
    const serviceName = services[service].en;
    const details = [
        [inquiryCopy.name, name],
        [inquiryCopy.email, email],
        [inquiryCopy.service, serviceName],
        [inquiryCopy.message, message],
    ];
    const summary = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="table-layout:fixed;background:#f4f4f5;margin:24px 0;">${details.map(([label, value]) => detail(label, value)).join("")}</table>`;
    const greeting = `${t.greeting} ${name},`;
    return [
        {
            from,
            to: [inbox],
            reply_to: email,
            subject: `${inquiryCopy.inquiry}: ${serviceName}`,
            html: frame(
                "en",
                inquiryCopy.inquiry,
                serviceName,
                paragraph(inquiryCopy.intro) + summary + paragraph(inquiryCopy.reply),
                "Iskra · byiskra.com",
            ),
            text: `${inquiryCopy.inquiry}\n\n${details.map(([label, value]) => `${label}: ${value}`).join("\n\n")}\n\n${inquiryCopy.reply}`,
        },
        {
            from,
            to: [email],
            reply_to: inbox,
            subject: t.subject,
            html: frame(
                language,
                t.heading,
                t.subject,
                [greeting, t.thanks, t.promise, t.extra, `${t.signoff} ${t.team}`]
                    .map(paragraph)
                    .join(""),
                t.footer,
            ),
            text: [
                greeting,
                t.thanks,
                t.promise,
                t.extra,
                `${t.signoff}\n${t.team}`,
                inbox,
                "https://byiskra.com",
                t.footer,
            ].join("\n\n"),
        },
    ];
}
