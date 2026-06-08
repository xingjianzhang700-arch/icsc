# Interlake Citizenship Services Club — Website

A static, SEO-friendly site for the Interlake Citizenship Services Club (ICSC). Three-language UI (English / Spanish / Chinese), signup form that emails to `interlakecitizenshipclub@gmail.com`.

## Files

- `index.html` — main page (hero, about, coverage, how it works, reviews, signup, contact)
- `styles.css` — styling, color palette matched to the flier
- `script.js` — language switcher (EN/ES/ZH), N/A toggles, footer year
- `thanks.html` — confirmation page after form submit
- `robots.txt`, `sitemap.xml` — SEO helpers

## Activating the signup form (one-time, ~1 minute)

The form posts to **FormSubmit.co**, a free email-forwarding service. No account needed, but you must activate it once:

1. Open the deployed site and submit **one test signup** through the form.
2. Check the inbox of `interlakecitizenshipclub@gmail.com` for an email from FormSubmit titled "Confirm your email".
3. Click the **Confirm Email** button in that message.
4. Done — all future submissions will arrive at that inbox as nicely formatted tables.

To use a different email later, change this line in `index.html`:

```html
<form ... action="https://formsubmit.co/YOUR_EMAIL@gmail.com" method="POST">
```

### Form features
- Each field (email, native language, test date, phone, preferred time) has an **N/A** option.
- Spam-protected by a hidden honeypot and an optional CAPTCHA (`_captcha` is `true`).
- Submissions redirect to `thanks.html`.

## Hosting

This is a static site. Drop the folder into any of these — all free:

- **GitHub Pages** — push the repo and turn on Pages in repo settings.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop or connect the GitHub repo.

For best SEO once deployed:
- Replace the `<loc>` paths in `sitemap.xml` and the `og:url`/canonical URLs in `index.html` with your real domain.
- Submit the sitemap in Google Search Console.

## SEO included out of the box
- Descriptive `<title>` and `<meta description>` with target keywords.
- Open Graph + Twitter card tags for social previews.
- JSON-LD structured data (`EducationalOrganization`) so Google understands what the club is.
- Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`).
- Mobile-responsive layout.
- `robots.txt` + `sitemap.xml`.

## Language switcher
Top-right of the header. The site auto-detects browser language on first visit and remembers the choice in `localStorage`.
