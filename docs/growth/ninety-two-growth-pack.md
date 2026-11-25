# Growth pack: weareninetytwo.com, thisisboth.com, ninetytwobrandco.com

Everything below is paste-ready draft copy and a checklist. Items in [BRACKETS] are things only you know (real shipping times, return window, etc). Fill them in before publishing. Nothing here has been published or changed on any site.

Based on a public-page audit on 2026-11-25. No traffic or sales data was available (Shopify sign-in expired, Supermetrics trial ended 2026-11-12).

---

## 0. This week (about 4 hours total, biggest payoff first)

1. weareninetytwo.com: turn on spam protection on the /get-started/ form (section 1.2). Fixes the junk leads.
2. ninetytwobrandco.com: fix the New York Cap sold-out mismatch and add the welcome popup (section 2.1, 2.2).
3. thisisboth.com: add the own-brand disclosure to /peptides and /peptides/shop (section 3.1).
4. Reconnect Shopify in claude.ai connector settings so the store numbers can be pulled.
5. Export Search Console (Queries + Pages, last 3 months) for thisisboth.com and weareninetytwo.com, plus the Google Ads campaign report, and send them over.

---

## 1. weareninetytwo.com (leads)

### 1.1 Home hero (replace the abstract H1 area, keep the four-pillar story below it)

- H1: **Rochester branding, signage and vehicle wraps, built as one system.**
- Subhead: An independent creative studio in Rochester, NY. We take brands from strategy to storefront, fleet and screen, with senior people on every project.
- Primary button: **Start a project**
- Secondary link: **Not sure where to start? Get a free website diagnostic**

(Keep the lowercase style in headings if you like it. Use normal capitalization in body copy for readability.)

### 1.2 Stop the spam (do these in order)

1. Add a honeypot field (hidden input that humans never fill). Reject the submission if it has a value.
2. Add Cloudflare Turnstile (free, invisible) or reCAPTCHA v3 to the form.
3. Reject submissions faster than about 3 seconds after page load.
4. Block obvious junk server-side: URLs in the project summary field, emails from disposable-mail domains.
5. In GA4, count a lead only after the form succeeds (key event on the thank-you page), not on a button click, so spam stops inflating lead numbers.

### 1.3 Form changes

- Company: make optional.
- Add: phone (optional).
- Add under the button: "We reply within [1 business day]. Your details are only used to respond to your inquiry."
- Add a project-type option: "Not sure yet", routing to a short call booking.
- Add a budget floor message above the budget field if you have one: "Most projects start around [$X]."

### 1.4 Titles and meta (draft)

| Page | Title tag | Meta description |
|---|---|---|
| /get-started/ | Start a Project | ninety two, Rochester NY | Tell us about your branding, signage, wrap or web project. Budget and timeline up front, a reply within [1 business day]. |
| Home | Rochester Branding, Signage and Web Design | ninety two | Independent Rochester studio for brand strategy, identity, signage, vehicle wraps and websites. Senior people on every project. |
| /our-services/ | Branding, Web and Signage Services in Rochester | ninety two | Brand foundation, digital, campaigns and physical rollout from one team. |
| Vehicle wraps | Vehicle Wraps in Rochester, NY | ninety two | [Design, print and install for fleets and single vehicles.] Typical timeline and pricing factors inside. |

### 1.5 Proof (this is what turns visitors into inquiries)

- Add 2 to 3 named testimonials with one concrete result each, on the home page and each service page.
- Add a client logo strip near every Start a project button.
- Mark "conceptual" work clearly, and swap in live projects as they ship.
- Add "typical project" ranges to the signage and wraps pages, for example "Most signage projects land between [$X and $Y]". Pricing signals filter out bad leads and lift good ones.

### 1.6 Technical cleanup

- Pick one host (www or apex) and 301 the other.
- Add lastmod dates to the sitemap.
- Use /insights/ only and redirect /blog/ and the root-level post URLs into it.
- Add LocalBusiness and FAQPage schema (the signage Q&A is ready for FAQPage).
- Decide whether to keep the Buffalo page. If you do not serve Buffalo, remove it.

### 1.7 Getting real leads (outbound, since the form is not enough)

Target list: Rochester-area multi-location and fleet businesses (home services, healthcare groups, restaurants, regional distributors) and mid-size B2B companies due a website redesign.

Email 1 (short, no attachment):

> Subject: [Company] fleet / signage rollout
>
> Hi [First name], I'm [Name] at ninety two, an independent studio in Rochester. We recently [one concrete project]. I noticed [specific observation about their branding, vehicles or site]. Worth a 15 minute call to see if we can help with [specific thing]?

Follow up twice at 3 and 7 days with one proof point each. Apollo is connected here, so I can build the list and sequences when you want.

---

## 2. ninetytwobrandco.com (Shopify, to pay for itself)

Math: at $30 to $60 per item, the $40-something monthly Shopify bill is covered by about 1 to 2 orders a month. Everything beyond that is profit. The goal is steady email-driven drops, not ad spend.

### 2.1 Fix the stock mismatch (do today)

- Product page shows New York Cap as sold out while the collection says in stock. In Shopify admin, open the product, check Inventory tracked and Quantity per variant, and check whether the theme's collection badge uses a stale cache. Hide or badge sold-out items.
- Turn on a back-in-stock notify form on sold-out products. Shopify's free "Back in Stock" or Shopify Email flows do this, or use Klaviyo (free tier).

### 2.2 Welcome offer popup (draft)

- Headline: **15% off your first order.**
- Body: Join the list for drops, restocks and early access.
- Field: Email
- Button: **Get my 15%**
- Footer: One use per customer. Excludes [sale items]. Unsubscribe anytime.
- Timing: show after 8 seconds or on exit intent, not on first paint. Mobile: small bottom banner.

### 2.3 Welcome email flow (3 emails)

1. **Immediately:** "Here's your 15%." Code, 3 best sellers, shipping and returns line.
2. **Day 2:** "The story behind ninety two." Short brand story, one product feature.
3. **Day 5:** "Still thinking about it?" Reminder the code expires on [date], with the product they viewed.

Plus an abandoned-cart email at 1 hour and at 24 hours.

### 2.4 Product page block (add near Add to cart)

> **Shipping:** Orders ship in [1 to 3] business days. Delivery in [3 to 7] business days in the US.
> **Returns:** [30]-day returns on unworn items. Free exchanges on size.
> **Quality:** 100% cotton, [5.0 to 5.3 oz] fabric weight.

Add 3 to 5 real reviews or photos from friends and early buyers. Even 5 genuine reviews improve conversion on a small catalog.

### 2.5 SEO basics (copy patterns)

- Titles: `{Product} | {Color} {Type} | ninety two brand co.` (example: "Classic Logo Tee, Black Cotton Streetwear Tee | ninety two brand co.")
- Alt text: describe the image: "Black Classic Logo Tee on a hanger, front view".
- Meta description: first sentence names the product, fabric, and fit, then a call to action.
- Replace "elevate your style" with a concrete line: "Heavyweight cotton streetwear from Rochester, NY. Small runs, no restocks."

### 2.6 Drop calendar (cheap and repeatable)

- Every 3 to 4 weeks: one small drop of 1 to 2 items.
- Teaser post 5 days before, email to the list 1 day before, early access for subscribers, public launch.
- Cross-promote to BOTH readers only where it fits (fitness and lifestyle items).

---

## 3. thisisboth.com (traffic and revenue engine)

### 3.1 Disclosure for own-brand products (add to /peptides and /peptides/shop, and extend /affiliate-disclosure)

> **How BOTH makes money.** BOTH earns commissions when you buy through some links on this site, and we plan to sell our own supplement and skincare products. Our evidence ratings are set before we consider any commercial relationship and are not influenced by it. See our [editorial policy] and [affiliate disclosure].

On /peptides/shop, change the testing wording to a future plan: "We plan to test each batch with an independent lab and publish the results before we ship [if/when launched]." Only state testing as fact once it is true.

### 3.2 Reviewer and dates block (template for every health page)

> **Written by** [author name] · **Reviewed by** [credentialed reviewer, e.g. RD, MD, PharmD] · **Last reviewed** [date] · [How we review]

If you do not have a credentialed reviewer yet, recruit one for the peptide and supplement pages first. This is the single biggest trust upgrade on a health topic (E-E-A-T).

### 3.3 Duplicate content consolidation plan

| Cluster | Keep as pillar | Redirect or merge into the pillar |
|---|---|---|
| Magnesium | magnesium-guide | magnesium-citrate, magnesium-oxide, glycinate-vs-citrate, citrate-vs-oxide, glycinate-for-sleep (keep one comparison page if it ranks) |
| Protein | protein-guide | protein-intake, high-protein-foods, high-protein-meal-prep, high-protein-breakfast-ideas, high-protein-diet-body-recomposition |
| HRV | one HRV guide | the other three HRV pages |
| Nervous system and vagus | one pillar | the other three |
| Sleep | sleep-basics | sleep-hygiene (merge), keep sleep-trackers as a product comparison |
| Hydration | one pillar | merge electrolyte-drinks |
| Meditation | one pillar | merge mindfulness-meditation |

Before redirecting any page, check Search Console: keep whichever URL already gets impressions and clicks, and redirect the others into it with a 301. Do not delete pages that currently rank.

### 3.4 Newsletter and lead magnets (replace the three identical boxes)

- Peptide guide: **"Peptide reality check (1-page PDF): what's approved, what's not, and the red flags in 'research use only' products."**
- Creatine guide: **"Creatine cheat sheet: dose, timing, who should skip it."**
- Quiz results page: **"Email me my priorities plan."**
- Place the box after the "Quick answer" section, not only at the bottom.

Welcome sequence (5 emails over 10 days): the plan, then one guide a day tied to their quiz result, ending with the product picks.

### 3.5 Home page and titles

- Add a keyword-bearing subhead under the poetic H1: "Evidence-based guides to supplements, sleep, recovery and performance."
- Fix the "| both" casing to "| BOTH".
- Write a unique meta description for every guide and peptide page (about 150 characters, answer plus reason to click).
- Check the raw HTML for Article, FAQ, Breadcrumb and Organization schema, and add what is missing.

### 3.6 Money plan (honest and low risk)

1. **Now:** keep affiliate links for things you already review (creatine, protein, wearables). Add 3 to 5 more programs in categories you already cover (sleep trackers, testing kits, magnesium brands).
2. **Peptides:** keep the guide educational. Monetize through a licensed telehealth or pharmacy partner (a real prescriber and a licensed pharmacy), and not through "research use only" sellers. Link only to partners you have vetted, label them clearly as paid links, and keep the "no dosing or injection instructions" rule.
3. **Own brand (collagen, glutathione, skincare):** launch only after a legal review of structure-function claims and third-party testing is actually in place.
4. **Later:** a paid newsletter or membership if the email list grows.

### 3.7 First 10 pieces to publish or refresh (pick from what already ranks)

Refresh the pillar pages from section 3.3 first. Then these new pieces (adjust to what Search Console shows you):

1. Peptides: how to spot a "research use only" red flag
2. GLP-1 medications: what the evidence says (education only)
3. Creatine vs. protein: what to buy first
4. Best sleep trackers compared (extend Oura vs Whoop)
5. Magnesium for sleep: does it work?
6. How much protein do you actually need?
7. Electrolytes: when they matter and when they do not
8. HRV: what a good number looks like
9. Supplements worth taking, and the ones that are not
10. Recovery after training: what actually helps

Each guide becomes 3 to 5 short videos (hook, one finding, one caution, link in bio) for TikTok, Reels and Shorts.

---

## 4. 30-day calendar

| Week | weareninetytwo | Brand Co | BOTH |
|---|---|---|---|
| 1 | Spam protection, form changes, title fixes | Fix stock mismatch, popup live, welcome flow | Disclosure and reviewer block live |
| 2 | Hero rewrite, 2 testimonials, logo strip | Product page shipping/returns, reviews, alt text | Consolidate magnesium and protein clusters |
| 3 | Outbound list (50 prospects), 2 emails | First drop teaser | Lead magnet and welcome sequence live, publish 3 pieces |
| 4 | Review leads, fix what converts | First drop, restock alerts | 3 more pieces, start video clips |

## 5. What I need to do the numbers part

- Reconnect Shopify in claude.ai connector settings.
- Search Console exports for the two sites, GA4 exports (Traffic acquisition, Landing pages), and the Google Ads campaign report.
- Then I will add baselines and targets for each line above.
