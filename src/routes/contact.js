import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createContactEmails, services } from "../emails/contact.js";

const contactRouter = new Hono();
const fail = (c, code, status) => c.json({ success: false, code }, status);

contactRouter.use("*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
});
contactRouter.use("*", bodyLimit({
    maxSize: 16 * 1024,
    onError: (c) => fail(c, "INVALID_INPUT", 413),
}));

// The site key is public; never return the secret key to the browser.
contactRouter.get("/config", (c) => {
    if (!c.env?.SITE_KEY) return fail(c, "UNAVAILABLE", 503);
    return c.json({ siteKey: c.env.SITE_KEY });
});

contactRouter.post("/", async (c) => {
    const origin = c.req.header("Origin");
    if (origin && origin !== new URL(c.req.url).origin) {
        return fail(c, "FORBIDDEN", 403);
    }
    if (c.req.header("Content-Type")?.split(";")[0].trim() !== "application/json") {
        return fail(c, "INVALID_INPUT", 415);
    }
    let input;
    try {
        input = await c.req.json();
    } catch {
        return fail(c, "INVALID_INPUT", 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return fail(c, "INVALID_INPUT", 400);
    }
    const fields = ["name", "email", "service", "message", "language", "submissionId"];
    if (fields.some((field) => typeof input[field] !== "string")) {
        return fail(c, "INVALID_INPUT", 400);
    }
    const data = Object.fromEntries(fields.map((field) => [field, input[field].trim()]));
    if (
        !data.name || data.name.length > 100 || /[\r\n\x00-\x1f\x7f]/.test(data.name) ||
        data.email.length > 254 ||
        !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(data.email) ||
        !Object.hasOwn(services, data.service) ||
        !data.message || data.message.length > 2000 ||
        !["hr", "en"].includes(data.language) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.submissionId) ||
        (input.website !== undefined && input.website !== "")
    ) {
        return fail(c, "INVALID_INPUT", 400);
    }
    if (typeof input.turnstileToken !== "string" || !input.turnstileToken || input.turnstileToken.length > 2048) {
        return fail(c, "TURNSTILE_FAILED", 400);
    }
    if (!c.env?.RESEND_API_KEY || !c.env?.CONTACT_RATE_LIMITER || !c.env?.TURNSTILE_SECRET_KEY) {
        return fail(c, "UNAVAILABLE", 503);
    }
    try {
        const { success } = await c.env.CONTACT_RATE_LIMITER.limit({
            key: c.req.header("CF-Connecting-IP") || "local",
        });
        if (!success) {
            c.header("Retry-After", "60");
            return fail(c, "RATE_LIMITED", 429);
        }
        const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                secret: c.env.TURNSTILE_SECRET_KEY,
                response: input.turnstileToken,
                remoteip: c.req.header("CF-Connecting-IP"),
            }),
            signal: AbortSignal.timeout(8000),
        });
        if (!verification.ok) return fail(c, "TURNSTILE_FAILED", 503);
        const verified = await verification.json();
        if (verified.success !== true || verified.action !== "contact" || verified.hostname !== new URL(c.req.url).hostname) {
            return fail(c, "TURNSTILE_FAILED", 403);
        }
        // Strict validation checks both messages before accepting either.
        // Retries reuse the same key if the browser did not receive the response.
        const response = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `contact/${data.submissionId}`,
            },
            body: JSON.stringify(createContactEmails(data)),
            signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) {
            // Never log secrets, inquiry content, or provider response bodies.
            console.error("Contact email provider rejected the request", response.status);
            return fail(c, "SEND_FAILED", 502);
        }
        const result = await response.json();
        if (result.data?.length !== 2 || !result.data.every((email) => email.id)) {
            return fail(c, "SEND_FAILED", 502);
        }
        return c.json({ success: true });
    } catch {
        console.error("Contact email request failed");
        return fail(c, "SEND_FAILED", 502);
    }
});

export default contactRouter;
