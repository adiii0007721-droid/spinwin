Spin & Win — Deployment bundle for c0in.man
==========================================

Included files:
- index.html    -> Main static landing page (spin wheel + claim form)
- styles.css    -> Styling
- script.js     -> Wheel logic, attempt tracking, claim submission (needs webhook)
- apps_script_example.txt -> Example Google Apps Script to accept POST and save claims to Google Sheets
- README.txt    -> This file

What I built:
- A self-contained static page that shows a spin wheel, asks for IG username, gives up to 3 attempts per username (tracked in browser localStorage + username key).
- Probability distribution is set so big prizes are rare. High-value prizes require manual verification when claiming.
- Claim submission is implemented as a POST to a webhook URL (you must host the webhook). Example Apps Script included.

How to make it "live" and receive real claims (quick):
1) Host the static site:
   - Easiest: GitHub Pages (push the files to a repo and enable Pages), or Netlify, Vercel, or any static host.
2) Configure a webhook to receive claim POSTs:
   - Option A (recommended): Use Google Apps Script + Google Sheet (example code in apps_script_example.txt).
   - Option B: Use any webhook receiver or a simple server (Node/PHP) that accepts JSON POST and writes to a database or Google Sheet.

Google Apps Script quick setup:
- Create a new Google Sheet (this will store claims).
- Open Extensions -> Apps Script.
- Paste the code from apps_script_example.txt, update the SHEET_NAME if needed.
- Deploy -> New deployment -> Select "Web app", set access to "Anyone" (or "Anyone with the link"), and deploy.
- Copy the Web App URL and paste it into script.js: replace REPLACE_WITH_YOUR_WEBHOOK_URL with that URL.

Verification notes (to avoid scam look):
- For every high-value claim (iPhone/₹1000), ask the user to send a screenshot proving they follow @c0in.man or provide their public IG profile link.
- Manually verify before dispatching the prize.
- Keep a public "Winners" area on your Instagram & landing page to show legitimacy (after first few winners).

Legal & safety:
- Do NOT ask for OTPs/passwords/payment information.
- Clearly state T&Cs and delivery timelines.

If you want, I can:
- Provide social post + story templates to promote the spin (Hindi + English).
- Provide the exact text for the winners announcement.
- Help you customize the probability values or wheel segments.

Enjoy and run ethically!
