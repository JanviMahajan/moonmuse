# MoonMuse Custom Studio

A responsive React/Vite storefront and customization experience for a handmade gifting studio.

## Live website

[Visit MoonMuse](https://moonmuse-beta.vercel.app)

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The public catalogue/editor can use seeded content locally. Guest checkout, verified order tracking, owner authentication and email delivery require Supabase. Keep the Supabase service-role key and Resend API key only in Edge Function secrets.

## Included

- Public shop, studio selector, Konva editor, design-service form, preview, order request, gallery, status and About pages
- Responsive editorial visual system and original generated seed photograph
- Supabase-authenticated owner-only `/admin` dashboard
- Guest checkout and token-protected order tracking without customer accounts
- Server-side Resend delivery records, retries, diagnostics and signed webhooks
- Normalized PostgreSQL schema, storage buckets and RLS policies
- Editor JSON persistence and high-resolution PNG preview export
- File type and 10 MB client-side validation in the editor

## Production deployment

1. Run `supabase/schema.sql`, then `supabase/migrations/202609020001_secure_guest_orders_email.sql` in the Supabase SQL editor.
2. Create the owner in Supabase Auth and set the matching `profiles.role` to `owner`.
3. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_OWNER_WHATSAPP` to Vercel.
4. Add these Supabase Edge Function secrets (not Vercel browser variables):

```env
RESEND_API_KEY=
WEB3FORMS_ACCESS_KEY=
OWNER_NOTIFICATION_EMAIL=
OWNER_WHATSAPP=
EMAIL_FROM=
PUBLIC_SITE_URL=https://moonmuse-beta.vercel.app
RESEND_WEBHOOK_SECRET=
```

`EMAIL_FROM` must use a sender/domain authorized in Resend. Owner order notifications use the server-only `WEB3FORMS_ACCESS_KEY`; customer emails continue through Resend. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `WEB3FORMS_ACCESS_KEY`, or webhook secrets through a `VITE_` variable.

5. Deploy `create-order`, `track-order`, `admin-email`, `admin-order`, `submit-design-request`, and `resend-webhook` from `supabase/functions`.
6. In Resend, point the webhook to `https://<project-ref>.supabase.co/functions/v1/resend-webhook`, subscribe to delivered/bounced/complained/failed events, and copy its signing secret into `RESEND_WEBHOOK_SECRET`.
7. Redeploy Vercel after changing any Vite variable. Edge Function secret changes do not belong in the frontend bundle.

The protected dashboard email test is at `/admin/settings/email`. It reports configuration presence without revealing values and returns the Resend provider message ID when accepted.
