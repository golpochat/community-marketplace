# Pilot feedback — form, invite copy, and check-ins

How pilot users share suggestions, report bugs, and how you turn replies into product decisions.

**Related:** [pilot-kickoff.md](./pilot-kickoff.md) · [launch-checklist.md](../product/launch-checklist.md) · `/contact` on the live site

---

## Channels (use all three)

| Channel | Best for | Owner action |
|---------|----------|--------------|
| **Google Form** | Structured feedback, weekly pulse | Review responses every 2–3 days |
| **Email** (`support@sellnearby.ie`) | Bugs, account issues, safety | Monitor daily; use subject `[Pilot feedback]` |
| **WhatsApp / Telegram** (optional) | Quick screenshots, “how do I…?” | Pin links to form + `/contact`; not for refunds |

**Not for pilot product feedback:** seller star ratings on listings (needs completed deals) or public review sites.

---

## Step 1 — Create the Google Form (~15 minutes)

1. Go to [Google Forms](https://forms.google.com) → **Blank form**.
2. Title: **SellNearby pilot feedback**
3. Description (paste):

   > Thanks for helping us test SellNearby before public launch. Your answers are private and used only to improve the product. There are no wrong answers — honest feedback is what we need most.

4. Add these questions **in order** (copy each line into Google Forms):

**Question 1** — Short answer · optional  
`Your name (optional)`

**Question 2** — Short answer · optional  
`Email (optional)`

**Question 3** — Multiple choice · required  
`I mainly used SellNearby as…`  
Options: `Buyer` · `Seller` · `Both` · `Signed up but haven't used it yet`

**Question 4** — Paragraph · required  
`What were you trying to do?`  
Description: e.g. list a pram, buy locally, set up payments

**Question 5** — Paragraph · required  
`What worked well?`

**Question 6** — Paragraph · required  
`What was confusing, broken, or missing?`  
Description: email support@sellnearby.ie with a screenshot if something broke

**Question 7** — Linear scale 1–5 · required  
`How likely are you to use SellNearby again after the pilot?`  
Label low: `1 — not at all` · Label high: `5 — definitely`

**Question 8** — Multiple choice · required  
`Would you recommend SellNearby to a friend in your area?`  
Options: `Yes` · `Maybe` · `No`

**Question 9** — Paragraph · optional  
`Anything else we should know?`

<details>
<summary>Same questions as a table</summary>

| # | Type | Question | Notes |
|---|------|----------|-------|
| 1 | Short answer | Your name (optional) | Not required |
| 2 | Short answer | Email (optional) | Not required — only if you want a reply |
| 3 | Multiple choice | I mainly used SellNearby as… | Buyer / Seller / Both / Signed up but haven’t used it yet |
| 4 | Paragraph | What were you trying to do? | e.g. list a pram, buy locally, set up payments |
| 5 | Paragraph | What worked well? | |
| 6 | Paragraph | What was confusing, broken, or missing? | Encourage screenshots in email if needed |
| 7 | Linear scale 1–5 | How likely are you to use SellNearby again after the pilot? | 1 = not at all, 5 = definitely |
| 8 | Multiple choice | Would you recommend SellNearby to a friend in your area? | Yes / Maybe / No |
| 9 | Paragraph | Anything else we should know? | Optional |

</details>

5. **Settings** → Responses → turn on **Collect email addresses** only if you want automatic identity (optional).
6. Click **Publish** (top right). Google Forms will not accept answers until the form is published.
7. Copy the **public** link — **not** the `/edit` URL from your browser address bar.
   - In the form editor: click **Send** (top right) → link icon → **Shorten URL** optional → copy.
   - Must end with **`/viewform`**, not `/edit`.
   - Example (your form):  
     `https://docs.google.com/forms/d/e/1FAIpQLSfW0ESnBC-x4xavROgHKCM_ReLcpaYTmIB2ppj7sEPLHadDiQ/viewform`
8. Set it in production web env and rebuild:

   ```bash
   # .env.prod on VPS
   PILOT_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSfW0ESnBC-x4xavROgHKCM_ReLcpaYTmIB2ppj7sEPLHadDiQ/viewform
   ```

   Local dev (`apps/web/.env`):

   ```bash
   NEXT_PUBLIC_PILOT_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSfW0ESnBC-x4xavROgHKCM_ReLcpaYTmIB2ppj7sEPLHadDiQ/viewform
   ```

   Then run `./infra/scripts/vps-update.sh` on the VPS (rebuilds the web image). Restart `pnpm dev` locally after changing `.env`.

The link appears on [https://sellnearby.ie/contact](https://sellnearby.ie/contact) under **Pilot participants**.

---

## Step 2 — Pilot participant guide (pin in WhatsApp or footer of invite)

Paste this as one block:

> **How to help us improve SellNearby**
>
> - **Quick feedback (2 min):** https://docs.google.com/forms/d/e/1FAIpQLSfW0ESnBC-x4xavROgHKCM_ReLcpaYTmIB2ppj7sEPLHadDiQ/viewform — use this anytime something feels off or when we ask for a weekly check-in.
> - **Bug or account issue:** email [support@sellnearby.ie](mailto:support@sellnearby.ie?subject=%5BPilot%20feedback%5D) with subject `[Pilot feedback]` — include what you clicked and a screenshot if you can.
> - **Safety on a listing:** use **Report listing** on that page (faster than email).
> - **Refunds / disputes:** email support — don’t handle these in the group chat.
>
> We’ll do a short check-in around **day 3** and **day 14** of the pilot. Thanks for being an early tester.

---

## Step 3 — Invite email template

**Subject:** You're invited to the SellNearby pilot (Ireland)

**Body:**

```
Hi [Name],

You're invited to test SellNearby — a local marketplace for buying and selling safely in Ireland.

Sign up: https://sellnearby.ie/auth/register
Browse listings: https://sellnearby.ie/listings

Pilot password / notes: [if applicable — e.g. OTP codes in pilot mode, or any invite-only detail]

How to give feedback:
• Short form (2 min): https://docs.google.com/forms/d/e/1FAIpQLSfW0ESnBC-x4xavROgHKCM_ReLcpaYTmIB2ppj7sEPLHadDiQ/viewform
• Bugs or support: support@sellnearby.ie — subject: [Pilot feedback]
• Optional pilot chat: [WhatsApp group link]

We'll check in around day 3 and day 14. Honest feedback — good or bad — is exactly what we need.

Safety before meet-ups: https://sellnearby.ie/safety

Thanks,
[Your name]
SellNearby
```

---

## Step 4 — Check-in scripts

### Day 3 (message or 10-min call)

1. Did you manage to register and complete your main goal (list / buy / browse)?
2. What stopped you, if anything?
3. Would you meet a buyer/seller from the app in person today? Why or why not?
4. Please submit the form if you haven’t: [form link]

### Day 14 (15-min call recommended)

1. Walk through their last session — what did they click?
2. Top 3 annoyances (their words).
3. Compared to DoneDeal / Facebook Marketplace / nothing — what’s better or worse?
4. Likelihood to use again (1–5) and would they tell a friend?
5. One feature they’d pay for or one they’d never use.

Log notes in a simple spreadsheet: **Date · User · Role · Theme · Quote · Priority (P0/P1/P2)**.

---

## Triage rules

| Incoming | Action |
|----------|--------|
| Broken flow / can’t pay / can’t list | **P0** — fix or workaround within 24h; reply to user |
| Confusing UX, copy | **P1** — batch for next deploy |
| Feature request | **P2** — backlog; note frequency |
| Safety report on listing | Moderation queue first; email second |
| Refund / dispute | Playbook in [launch-checklist](../product/launch-checklist.md); no public promises in chat |

After **2 weeks**, review with the table in [pilot-kickoff Phase C](./pilot-kickoff.md#phase-c--learn--plan-public-launch-week-34).

---

## Checklist

- [ ] Google Form created and link saved
- [ ] `PILOT_FEEDBACK_FORM_URL` set in `.env.prod` on VPS; web redeployed
- [ ] `/contact` shows pilot section with form link
- [ ] Invite email sent with form + support mailto
- [ ] WhatsApp/Telegram group created (optional); pinned participant guide
- [ ] Support inbox monitored daily
- [ ] Day 3 and day 14 check-ins scheduled
