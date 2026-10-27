# Mountaintop Management Group — website

Static site on GitHub Pages (custom domain in `CNAME`). The homepage and the legal pages are separate from the Google Ads landing pages below.

## Google Ads landing pages

| URL | Audience | Form "Customer Type" default |
|---|---|---|
| `/dealer-transport` | Dealerships | Dealership |
| `/auction-transport` | Auctions / remarketing | Auction / Remarketing |
| `/multi-vehicle-transport` | Fleets, multi-car, ports & terminals | Business / Fleet |
| `/car-shipping-quote` | Private customers | Private customer |
| `/thank-you` | After any form submit (homepage form too) | — |

All five pages are `noindex`, are not linked from the homepage, and are not in any sitemap.

Shared files:
- `assets/config.js`: all settings (GTM ID, phone, email, form key, webhook)
- `assets/lp.css`: styles
- `assets/lp.js`: phone tracking, ad attribution, 2-step form, mobile sticky bar
- `images/*.webp`: WebP versions of the real truck photos

## Where to paste the GTM ID

1. `assets/config.js` → `GTM_ID: 'GTM-XXXXXXX'` (this loads GTM on every landing page).
2. Also replace `GTM-XXXXXXX` in the `<noscript>` iframe near the top of `<body>` in these 5 files: `dealer-transport.html`, `auction-transport.html`, `multi-vehicle-transport.html`, `car-shipping-quote.html`, `thank-you.html`.

GTM does not load while the ID still contains `XXXX`. No Google Ads, GA4 or Meta tags are hardcoded; add them inside GTM.

## Where leads go

Form submissions go through Web3Forms (`WEB3FORMS_KEY` in `assets/config.js`) and are emailed to the inbox that key was created with: **mountaintopmng@gmail.com**. To send leads somewhere else, create a new key at web3forms.com with the new email and replace `WEB3FORMS_KEY`.

Each email includes the page, route, vehicle, contact details and ad attribution: `gclid`, `gbraid`, `wbraid`, `utm_*` and `landing_page` (kept in a first-party cookie `mtmg_attr` for 90 days).

CRM later: set `WEBHOOK_URL` in `assets/config.js`; every lead is then also POSTed there as JSON.

## Change phone or email

Edit `PHONE_DISPLAY`, `PHONE_TEL` and `CONTACT_EMAIL` in `assets/config.js`. Every phone number on the landing pages uses the `.js-phone` class, so Google's forwarding-number swap replaces all of them. (The number is also written in the HTML as a fallback; update it there too if it changes permanently.)

## Tracking events (dataLayer)

| Event | When | Extra fields |
|---|---|---|
| `phone_click` | any `tel:` link tapped | `location`: `header`, `cta`, `sticky`, `footer`, `thank-you` |
| `quote_form_step2` | visitor finishes step 1 | — |
| `quote_form_submit` | lead sent, just before redirect to `/thank-you` | `customer_type`, `vehicles` |

## Test checklist

1. Open a landing page with `?gclid=TEST123&utm_source=google` added to the URL.
2. In GTM, click **Preview** and connect to that URL.
3. Step 1: leave fields empty and click **Next**: inline errors show. Fill them in: step 2 opens without reloading the page.
4. Step 2: fill in and submit: the page goes to `/thank-you` and `quote_form_submit` shows in GTM Preview.
5. Check mountaintopmng@gmail.com: the email arrives and shows `gclid = TEST123`.
6. Tap the phone number in the header: `phone_click` with `location: header` fires.
7. On a phone: the bottom bar (Call Dispatch / Get Quote) shows after scrolling past the form and hides when the form is on screen.
