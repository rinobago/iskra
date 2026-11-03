import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/index.js";
import { createContactEmails } from "../src/emails/contact.js";

const valid = {
    name: "Ana Marić", email: "ana@example.com", service: "website",
    message: "Trebamo novu stranicu.\nHvala!", language: "hr", website: "",
    submissionId: "1f653d67-8e93-47ca-9ef8-39219dc1e840",
};
const env = {
    RESEND_API_KEY: "test-key-not-real",
    CONTACT_RATE_LIMITER: { limit: async () => ({ success: true }) },
};
function submit(data = valid, bindings = env, headers = {}) {
    return app.request("https://byiskra.com/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(data),
    }, bindings);
}
const accepted = () => Response.json({ data: [{ id: "owner-email" }, { id: "confirmation-email" }] });

test("both form languages send an English inquiry and a localized confirmation", async (t) => {
    const calls = [];
    t.mock.method(globalThis, "fetch", async (url, options) => {
        calls.push({ url, options });
        return accepted();
    });
    for (const language of ["hr", "en"]) {
        const response = await submit({ ...valid, language });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { success: true });
        assert.equal(response.headers.get("Cache-Control"), "no-store");
        const { url, options } = calls.at(-1);
        assert.equal(url, "https://api.resend.com/emails/batch");
        assert.equal(options.headers.Authorization, "Bearer test-key-not-real");
        assert.equal(options.headers["Idempotency-Key"], `contact/${valid.submissionId}`);
        const [owner, visitor] = JSON.parse(options.body);
        assert.deepEqual(owner.to, ["hello@byiskra.com"]);
        assert.deepEqual(visitor.to, [valid.email]);
        assert.equal(owner.reply_to, valid.email);
        assert.equal(visitor.reply_to, "hello@byiskra.com");
        for (const email of [owner, visitor]) {
            assert.equal(email.from, "Iskra <hello@byiskra.com>");
            assert(email.html.includes(valid.name));
            assert(email.text.includes(valid.name));
        }
        assert(owner.html.includes('<html lang="en">'));
        assert(visitor.html.includes(`<html lang="${language}">`));
        assert.equal(owner.subject, "New project inquiry: Website development");
        assert(owner.text.includes("Full name: Ana Marić"));
        assert(owner.text.includes(valid.message));
        assert(owner.text.includes(valid.email));
        assert(owner.text.includes("Service: Website development"));
        assert(visitor.text.includes(language === "hr" ? "najkraćem mogućem roku" : "as quickly as possible"));
        assert(!visitor.text.includes(valid.message));
    }
});

test("HTML is escaped and message line breaks survive", () => {
    const [owner, visitor] = createContactEmails({ ...valid, name: '<b>Ana & "team"</b>', message: '<img src=x onerror=alert(1)>\nSecond line' });
    assert(!owner.html.includes("<img src=x"));
    assert(owner.html.includes("&lt;img src=x onerror=alert(1)&gt;<br />Second line"));
    assert(visitor.html.includes("&lt;b&gt;Ana &amp; &quot;team&quot;&lt;/b&gt;"));
});

test("invalid submissions cannot send email", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not send"); });
    const invalid = [null, [], {}, { name: " " }, { name: 42 }, { name: "a".repeat(101) },
        { name: "Ana\r\nBcc: other@example.com" }, { email: "bad-address" },
        { email: "a@example.com\r\nBcc: other@example.com" }, { email: "a@example.com,b@example.com" },
        { service: "" }, { service: "__proto__" }, { message: " " }, { message: "a".repeat(2001) },
        { language: "de" }, { submissionId: "bad-id" }, { website: "spam.example" }];
    for (const changes of invalid) {
        const input = changes === null || Array.isArray(changes) ? changes : { ...valid, ...changes };
        // An empty object above becomes valid when merged; test the actual empty body separately.
        if (changes && Object.keys(changes).length === 0 && !Array.isArray(changes)) continue;
        const response = await submit(input);
        assert.equal(response.status, 400, JSON.stringify(changes));
    }
    assert.equal((await submit({})).status, 400);
    assert.equal(fetch.mock.callCount(), 0);
});

test("bad JSON, oversized bodies, wrong content types, and cross-origin posts are rejected", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => accepted());
    const malformed = await app.request("https://byiskra.com/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
    }, env);
    assert.equal(malformed.status, 400);
    assert.equal((await submit({ ...valid, message: "x".repeat(17000) })).status, 413);
    assert.equal((await submit(valid, env, { "Content-Type": "text/plain" })).status, 415);
    assert.equal((await submit(valid, env, { Origin: "https://other.example" })).status, 403);
    assert.equal(fetch.mock.callCount(), 0);
});

test("missing configuration and throttling fail without contacting Resend", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => accepted());
    assert.equal((await submit(valid, {})).status, 503);
    assert.equal((await submit(valid, { RESEND_API_KEY: "test" })).status, 503);
    const response = await submit(valid, { ...env, CONTACT_RATE_LIMITER: { limit: async () => ({ success: false }) } });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.equal((await response.json()).code, "RATE_LIMITED");
    assert.equal(fetch.mock.callCount(), 0);
});

test("provider failures never report success or expose provider errors", async (t) => {
    t.mock.method(console, "error", () => {});
    const fetch = t.mock.method(globalThis, "fetch");
    for (const result of [
        () => Response.json({ message: "private provider detail" }, { status: 401 }),
        () => Response.json({ data: [{ id: "only-one" }] }),
        () => new Response("not JSON"),
        () => { throw new DOMException("Timeout", "TimeoutError"); },
    ]) {
        fetch.mock.mockImplementation(async () => result());
        const response = await submit();
        assert.equal(response.status, 502);
        assert.deepEqual(await response.json(), { success: false, code: "SEND_FAILED" });
    }
});

test("retries use an identical batch and idempotency key", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => accepted());
    await submit();
    await submit();
    const [first, second] = fetch.mock.calls.map((call) => call.arguments[1]);
    assert.equal(first.headers["Idempotency-Key"], second.headers["Idempotency-Key"]);
    assert.equal(first.body, second.body);
});
