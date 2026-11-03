# Iskra website

Static pages live in `public/`. The Cloudflare Worker in `src/` handles `/api/*`.

## Contact email setup

1. Add and verify **byiskra.com** in [Resend](https://resend.com/docs/dashboard/domains/introduction), so it can send as `Iskra <hello@byiskra.com>`. Keep the existing receiving mailbox/routing for `hello@byiskra.com`.
2. Create a Resend API key with sending access to that domain.
3. Add a Cloudflare Worker **secret** named `RESEND_API_KEY` (not a public variable or a value in HTML/JavaScript):

   ```sh
   npx wrangler secret put RESEND_API_KEY
   ```

   Paste the key into the prompt. Alternatively use the Worker's Settings → Variables and Secrets in Cloudflare. This command updates the deployed Worker's secret.
4. Deploy the updated code with your Cloudflare workflow. The existing `npm run build` script builds CSS **and deploys** the Worker. It is not a local-only build.

For local development, copy `.dev.vars.example` to `.dev.vars`, fill in the key, and run `npm run dev`. `.dev.vars` is ignored by Git. Local submissions with a real key send real emails.

## Email behavior

- Required fields: name, valid email, service, and project message. Inquiry emails to Iskra always use English labels and service names. The page language selects Croatian or English for the visitor’s confirmation and form feedback. Visitor-written messages are preserved as submitted.
- One [Resend batch](https://resend.com/docs/api-reference/emails/send-batch-emails) sends the full inquiry to `hello@byiskra.com` and a separate thank-you message to the visitor. Both have HTML and plain-text versions. Replying to the inquiry addresses the visitor; replying to the confirmation addresses Iskra.
- Success means Resend accepted both messages, not a guarantee of inbox delivery. Check Resend's delivery logs for bounces.
- Errors preserve the form inputs. An unchanged retry in the same page reuses the submission ID; [Resend deduplicates it for 24 hours](https://resend.com/docs/dashboard/emails/idempotency-keys). Refreshing the page starts a new submission.
- Input limits, escaped HTML, a honeypot, same-origin browser checks, and a Cloudflare rate limiter provide basic abuse protection. The limiter allows approximately five attempts per IP per minute per Cloudflare location; it is not a CAPTCHA or a strict global quota.

## Verification

```sh
npm test
npm run build:css
npx wrangler deploy --dry-run --outdir /tmp/iskra-worker-check
```

Tests mock Resend and do not send mail. A real delivery check needs the configured secret and verified domain.
