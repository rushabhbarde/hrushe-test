# HRUSHE Premium Brand, UX, CRO, and Codebase Audit

Audit date: 21 June 2026  
Scope: live storefront at `hrushe.in`, desktop and 390 px mobile flows, homepage, shop, PDP, cart, checkout, story, policies, SEO output, admin dashboard, authentication, APIs, database, payments, media storage, frontend, backend, build, lint, and tests.

## 1. Executive summary

HRUSHE is not a premium fashion brand yet. It is a ₹599 single-product DTC store wearing a competent COS-inspired interface.

The visual redesign is the strongest part of the business. “Defined Quietly,” the warm neutral palette, the square geometry, whitespace, and restrained layout create a credible premium first frame. Then the product reality breaks the promise: inconsistent and visibly synthetic/composited photography, generic copy, empty fabric and GSM data, fabricated fallback specifications, no size or colour exchanges, disabled inventory tracking, no verified customer proof, and a backend that can leave the collection empty after a 20-second timeout.

The core problem is not a missing animation or a weak button style. It is the distance between what the brand claims and what it proves.

The blunt version:

- The interface is approximately a 7/10 design direction.
- The photography is approximately a ₹500–₹1,000 marketplace signal.
- The product data is incomplete enough to undermine the claims.
- The return policy is hostile to online fashion conversion.
- The commerce architecture is too fragile for paid traffic.
- The brand currently borrows premium codes instead of owning a defensible point of view.

Do not spend the next month polishing CSS. Fix product truth, photography, returns, inventory, media delivery, and server rendering first.

## 2. Scorecard

| Dimension | Score | Verdict |
|---|---:|---|
| Current overall | 4.8/10 | Attractive shell, weak commercial foundation |
| Premium brand | 4.2/10 | Premium language without premium proof |
| Brand identity | 6.1/10 | “Defined Quietly” and the palette are usable assets |
| Premium positioning | 4.0/10 | Price, policy, photography, and product depth contradict it |
| Luxury perception | 3.6/10 | Clean UI is not the same as luxury |
| UX | 6.0/10 | Clear core navigation; too much client waiting and duplication |
| Mobile | 5.7/10 | Good tap sizing; overlong PDP and delayed commerce state |
| Conversion | 3.5/10 | Returns, proof, fit confidence, and reliability are major blockers |
| Performance | 3.2/10 | 1.44 MB catalog JSON, base64 media, cold-start failure |
| Trust | 3.7/10 | Contact and policies exist, but the terms and claims reduce confidence |

### Evidence that materially affects these scores

- The public catalog response for only six products is **1,441,175 bytes**.
- Product photos and one review photo are embedded as base64 strings inside JSON.
- A cold catalog request exceeded the frontend's 20-second timeout and the homepage replaced eight skeleton cards with “The current collection will appear here.”
- A warm catalog request still transferred 1.44 MB and took 2.11 seconds in a direct test.
- Direct PDP HTML had a 2.75-second TTFB because metadata waits on the backend.
- The live homepage references approximately **663 KB of uncompressed JavaScript and 105 KB of CSS** before catalog JSON, font, hero image, and product media.
- The optimized hero is still a **506 KB PNG** and took approximately 2 seconds in a direct request.
- The server-rendered homepage contains eight product skeletons and no product names.
- **45 of 48 page files** are Client Components.
- The 390 px mobile PDP is **6,735 px tall** before the footer and renders four full-width related cards.
- Hidden desktop PDP media loads on mobile; hidden mobile media loads on desktop.
- Every live SKU is ₹599, has no GSM, fabric, feel, weight, construction note, product-specific size guide, or variants, and has inventory tracking disabled.
- The storefront displays fallback claims such as “Cotton jersey,” “Relaxed oversized fit,” a generic size chart, and “Campaign fit shown in size M” despite that data not existing in the catalog.
- The return policy allows returns only for damaged, defective, or incorrect items, requires contact within 48 hours, and provides no size or colour exchanges.
- Lint and production build pass. The three checkout inventory tests pass. The problem is not baseline compilation quality.

## 3. Phase 1 — brand audit

### First three seconds

The first frame is the best part of the site. The warm off-white, burgundy wordmark, large uppercase typography, and disciplined hero grid feel more considered than a typical small apparel store. “Defined Quietly” is memorable enough to keep.

The illusion fails quickly:

- The announcement resolves to the placeholder-like phrase **“Campaign banner”** on several live routes.
- The hero looks synthetic and over-composed rather than editorial.
- The product grid immediately shifts to inconsistent model, setting, lighting, and retouching.
- ₹599 anchors the brand in value fashion, not COS, ARKET, Represent, or Zara Studio territory.
- There is no factual material proof to justify “heavyweight,” “substantial,” or “premium.”

### What feels premium

- The “Defined Quietly” verbal territory.
- Restrained cream, black, and oxblood palette.
- Strong whitespace and editorial scale on desktop.
- Minimal navigation and focused six-colour assortment.
- Square controls and low-decoration layout.
- Visible contact information, order tracking, Razorpay, and policies.

### What feels cheap

- “Campaign banner” leaking into the customer-facing announcement bar.
- Synthetic-looking hero and colour-replaced product photos.
- Mixed studio and outdoor product imagery with different models and crops.
- Misspelled source name and slug: “Begie.”
- Generic product copy that could describe any cotton T-shirt.
- ₹599 price paired with a permanent ₹799 strike-through.
- Checkmark trust boxes that look self-declared rather than evidenced.
- No exchanges and a 48-hour issue window.
- Empty collection fallback after a long wait.
- Founder review data exists in the database and is explicitly filtered out in the UI; that history damages confidence even if hidden.

### What feels generic

- “Premium feel,” “modern streetwear aesthetic,” “made for repeat wear,” and “fewer, better” are category clichés without proprietary proof.
- The visual language is heavily derived from modern minimalist retailers.
- One oversized tee in six colours is an assortment, not yet a brand world.
- The story talks about restraint, material, and proportion but gives no named fabric, GSM, pattern development, factory, process, or test result.

### What feels inconsistent

- Premium editorial homepage versus low-budget/composited PDP photography.
- “Heavyweight” versus blank GSM and weight fields.
- “Fit before noise” versus a generic fallback size chart.
- “Fewer, better” versus no evidence of better construction.
- “Clear information before you order” versus no normal returns or fit exchanges.
- “Summer 2026” versus heavyweight positioning without an India-climate rationale.
- Product naming is transformed in the frontend while raw titles remain generic in metadata, cart, and account surfaces.

### Differentiation verdict

HRUSHE currently feels like a store with a good theme, not a fully formed brand. “Quiet premium basics” is occupied territory. The defensible opportunity is not to imitate European minimalism more accurately. It is to own **considered Indian everyday uniforms: transparent fabric specifications, proportions tested on Indian bodies, and pieces designed for Indian heat, movement, and repeat washing**. Only claim that after the product supports it.

## 4. Phase 2 — homepage audit

| Section | Purpose | Strength | Weakness | Conversion / premium impact |
|---|---|---|---|---|
| Announcement + header | Orient and reassure | Clean, sticky, minimal | “Campaign banner” placeholder; account/wishlist hidden inside mobile menu | Immediate credibility loss; cart remains accessible |
| Hero | Create desire and set positioning | Strong grid, headline, clear CTAs | Synthetic campaign image; generic “heavyweight” claim; image dominates without product proof | Desire rises, trust does not |
| Collection grid | Move visitors into products | Six-colour concept is easy to understand | Client-only load; 20-second failure; inconsistent photography; ₹599 collapses premium anchor | Largest commercial failure on home |
| Fabric & construction | Justify quality | Correct content category | Values are generic fallbacks because catalog fields are blank | Performs the language of proof without proof |
| Philosophy | Explain brand values | Clear, scannable, coherent | Generic “proportion/material/restraint” language | Mild brand lift, low conversion value |
| Trust badges | Reduce risk | Payment, delivery, support are visible | No return/exchange promise; self-asserted checkmarks | Avoids the hardest trust issue |
| Reviews | Social proof | Conditional design is sensible | No legitimate approved customer proof, so section disappears | Visitors receive no evidence from buyers |
| Newsletter | Retention | Restrained copy and clear form | Too early for a brand with no demonstrated value; no incentive or editorial proposition | Low expected signup rate |
| Footer | Service and legitimacy | Email, phone, Instagram, support hours, policies | No company/GST/legal summary in the footer; long on mobile | Better than average small-store footer |

### Homepage diagnosis

- The page is **brand-first**, then product-first. That sequence is correct.
- Visual hierarchy is strong on desktop and acceptable on mobile.
- It creates initial desire but cannot sustain it through the product grid.
- It creates basic operational trust, but the restrictive policy and missing proof undo it.
- It creates no legitimate urgency. That is not inherently bad for premium. Do not add countdown timers. Use real drop dates, low-stock states, and restock windows only when inventory is real.

### Recommended homepage structure

1. **Single factual utility bar:** “Complimentary India delivery · Dispatches in 1–3 business days.” Remove CMS placeholders.
2. **Header:** Shop, Story, Search; account/wishlist/cart. Keep mobile cart visible.
3. **Campaign hero:** One coherent image or short muted film, collection name, one sentence, one primary CTA. Include the starting price only if the price supports positioning.
4. **Proof rail above the fold:** exact fabric composition, GSM, fit, made-in location, returns/exchanges.
5. **Hero product chapter:** large front/back/model/fabric close-ups with “why it is different.”
6. **Colour story:** six swatches with names, availability, and direct variant navigation.
7. **Shop the edit:** six cards with consistent images and visible rating/fit cue.
8. **Fit system:** model heights/sizes, garment measurements, 8-second fit video, link to guide.
9. **Material/process story:** actual yarn, knit, GSM, wash test, neckline construction, supplier/factory facts.
10. **Editorial chapter:** Indian setting and styling, not generic European minimalism.
11. **Verified customer proof:** only verified purchases; UGC with consent.
12. **Service promise:** dispatch, exchange, returns, support response time.
13. **Founder note:** one concise reason the product exists, with a real studio/process image.
14. **Newsletter:** first access, restocks, fit notes, and editorial—not “updates.”
15. **Footer:** service, policies, business identity, social, payment, and contact.

## 5. Phase 3 — photography audit

### Verdict

The photography currently signals **₹500–₹1,000**, not ₹2,000 and certainly not ₹4,000+. The hero can briefly suggest ₹2,000, but the product grid immediately resets perception downward.

Problems:

- The hero appears AI-generated or heavily composited.
- Ecru uses a clean studio model while other colours use outdoor portraits.
- Several colourways reuse the same person, pose, and background with apparent colour replacement.
- Lighting, skin treatment, crop, environment, and camera distance are inconsistent.
- Product shape is hard to compare across colours.
- There are no back, side, neckline, hem, stitch, label, or fabric-macro views.
- There is no model height or worn size.
- Product images are portrait assets forced into a consistent card ratio, but the source compositions were not shot for that crop.
- There is no fit motion, drape, or wash-behaviour proof.

### Exact shoot recommendation

Run one two-day shoot for the entire first collection.

**Day 1 — commerce system**

- One controlled studio, warm-grey seamless, fixed camera height, fixed marks, and consistent 4:5 crop.
- 85 mm equivalent for front/back/side; 50 mm for three-quarter and movement.
- Soft 5500K key, large negative fill, repeatable exposure and white balance.
- At least two body types. Show S, M, and L on different people.
- Per colour: front, back, side, three-quarter, seated/movement, untucked full body, neckline macro, sleeve/hem macro, inside label, fabric macro.
- Record model height, chest, and worn size.
- Record one 8–12 second walk/turn loop per colour.
- Do not recolour one photograph into six SKUs. Shoot every physical colour.

**Day 2 — campaign system**

- Use one recognisably Indian modernist or raw urban location: concrete, stone, red oxide, shaded colonnade, or quiet industrial architecture.
- Shoot early morning and late afternoon; avoid random street clutter.
- One coherent cast and styling system: tonal trousers, minimal footwear, no distracting jewellery.
- 35 mm environmental frames, 50 mm group portraits, 85 mm quiet portraits.
- Campaign idea: **“The Everyday Interval”**—commute, shade, studio, café, evening; one tee moving through a full day.
- Secondary idea: **“Six Tones of the Same Day”**—each colour assigned one time/light condition, still held together by location and cast.

**Delivery specification**

- Master: 2400×3000 or larger, colour-managed sRGB.
- Storefront derivatives: AVIF/WebP, 4:5, approximately 120–250 KB per product image.
- Hero desktop and mobile art direction should be separate crops, each below roughly 400 KB.
- Store media as URLs in R2; never base64 inside product JSON.

### Reference brands and what to borrow

- **COS:** product crop consistency and garment detail—not its exact art direction.
- **ARKET:** factual material and construction storytelling.
- **Uniqlo U:** fit comparison, movement, and colour-system clarity.
- **Fear of God Essentials:** tonal campaign cohesion and silhouette recognition.
- **Represent:** conversion-oriented PDP media depth and fit confidence.
- **Zara Studio:** campaign pacing and art direction, used selectively.

## 6. Phase 4 — product page audit

### What works

- Large first image and simple purchase panel.
- Colour links make the six-SKU system understandable.
- Size controls are at least 48×48 px on mobile.
- Price and MRP tax note are clear.
- Size guide, care, delivery, reviews, and related products exist structurally.
- Mobile sticky CTA logic exists.
- Gallery supports swipe and video.

### What fails

- The PDP fetches the full catalog and then may fetch the product again.
- Hidden desktop and mobile media trees both download.
- The raw title and premium display title conflict.
- The page claims cotton jersey and oversized fit from frontend defaults, not product data.
- The generic size chart includes XL and XXL even though only S, M, and L are sold.
- “Campaign fit shown in size M” has no model data behind it.
- Fabric, GSM, feel, weight, and construction are blank.
- No pincode delivery estimate.
- No normal returns, size exchanges, or colour exchanges.
- No model measurements.
- No stock state because inventory tracking is disabled.
- No verified reviews or rating summary.
- Four full-width related cards make mobile excessively long.
- Gallery dots are only 6 px high, below a practical touch target.
- Accordions lack `aria-expanded` and `aria-controls`.
- The SKU is a MongoDB object ID, which feels internal and unpolished.
- A permanent strike-through discount makes the product feel promotional, not premium.

### Ideal HRUSHE PDP

1. Breadcrumb: Home / Tees / Form 01.
2. Five-to-eight consistent images plus fit video; no duplicated responsive DOM.
3. Product name, colour, price, tax, rating, and concise value proposition.
4. Colour swatches with real thumbnails and availability.
5. Size selector with stock, model data, fit recommendation, and garment measurements.
6. Pincode field with delivery date and serviceability.
7. Primary CTA; then genuine “exchange/return within 7 days” and payment reassurance.
8. Three proof bullets: exact composition, GSM, neckline/construction.
9. Expanders for details, traceability, care, measurements, delivery/returns.
10. Fit module with model carousel and body/garment measurement distinction.
11. Verified-purchase rating distribution and photo reviews.
12. Styling module or “complete the uniform,” not four repetitive full-width cards.
13. Recently viewed, only after core conversion content.

## 7. Phase 5 — UI/UX audit

### Strengths

- A coherent cream/black/oxblood token set exists.
- Buttons and controls generally reach 44–52 px.
- Focus-visible styles exist.
- Dialog focus trapping, Escape handling, body scroll lock, and focus restoration are implemented.
- Header, footer, cards, empty states, and loading states are reusable.
- The shop has useful size, colour, availability, and sort controls.

### Exact fixes

- Replace the customer-facing “Campaign banner” with a validated announcement string and add a CMS publish preview.
- Use one product naming source. Store the commercial name in the database; do not translate it differently per surface.
- Use one responsive PDP structure and CSS layout changes, not two rendered trees.
- Reduce mobile related products to a horizontal two-and-a-half-card rail or two cards.
- Show a meaningful cart skeleton immediately; do not render a blank `<main>` while auth resolves.
- Remove the terms checkbox from cart. Keep one linked acceptance at payment.
- Make checkout steps real: only render the active step or relabel the pattern as a single-page checkout.
- Add visible labels to checkout, tracking, newsletter, and review inputs; placeholders are not labels.
- Add `autocomplete`, `inputMode`, `pattern`, and appropriate `maxLength` values.
- Add `aria-expanded` and `aria-controls` to accordions and mobile menu.
- Give carousel dots a 44×44 hit area while keeping the visual mark small.
- Remove nested interactive elements: the wishlist has a button inside a link.
- Replace generic checkmark trust boxes with policy-backed copy and links.
- Keep the current palette, but limit oxblood to wordmark, active state, and one accent; do not use it as pseudo-error colour.
- Adopt an 8 px spacing scale and document only 6–8 approved section gaps.
- Use one display scale: 56/52 desktop, 40/38 tablet, 32/31 mobile. Several all-caps headings currently feel mechanically oversized.
- Keep Manrope for UI or license one stronger grotesk. Do not add a decorative serif just to imitate luxury.

## 8. Phase 6 — mobile audit

Mobile is usable but not conversion-optimised.

### What works

- Header menu and cart targets are 44×44 px.
- Product grid fits two 174 px cards at 390 px without horizontal overflow.
- Filter and sort controls are 48 px high.
- Size buttons are 48×48 px.
- Main add-to-bag CTA is full width.
- Cart remains visible in the header.

### Mobile conversion defects

- Hero image comes before the proposition, so the reason to buy is delayed by a full viewport.
- The mobile hero is a crop of a desktop composite, not intentionally art-directed.
- The product grid photography is too small to overcome inconsistency.
- Mobile account and wishlist are hidden inside the menu, increasing retrieval friction.
- PDP is 6,735 px tall; related products dominate the lower half.
- Hidden desktop PDP images still load on mobile.
- The first product media is 390×488, but all colour-thumbnail images also decode early.
- Slider dots have a 6 px interaction height.
- Trust badges become a dense two-column block with tiny copy.
- Support chat floats above bottom actions and can compete with the sticky CTA.
- Cart first renders blank while global auth checking completes.
- Checkout has ten fields, no autocomplete metadata, and fake step navigation while all contact/shipping fields remain visible.
- Terms are requested in cart and again at payment.
- Phone and pincode do not request numeric keyboards.
- No address lookup, pincode validation, or delivery-date preview.

## 9. Phase 7 — performance, Core Web Vitals, and SEO

Current official good thresholds are LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1 at the 75th percentile. See [Google's Web Vitals guidance](https://web.dev/articles/vitals?hl=en).

No trustworthy field LCP/INP/CLS dataset was available in this audit, and the public PageSpeed API quota was unavailable. Do not invent scores. Instrument them in production with `web-vitals` and segment by route, device, and connection.

### LCP

The likely homepage LCP is the hero image. It is correctly marked `priority` and its container reserves space, but the delivered asset is still a 506 KB PNG. Convert the source to AVIF/WebP, provide separate mobile art direction, and target a sub-400 KB hero. The PDP's 2.75-second server TTFB already consumes the entire good-LCP budget before its client gallery is useful.

### CLS

`next/image` containers reserve aspect ratio, which is good. The largest risk is application state replacement:

- Eight product skeletons collapse into a short empty-state panel after a timeout.
- Cart begins as a blank main region and expands after auth/cart hydration.
- Product and related sections arrive only after client fetch.

Keep server-rendered product shells and stable minimum heights. Measure layout-shift entries in production.

### INP

INP cannot be responsibly inferred without real interaction data. The risk factors are obvious: parsing 1.44 MB JSON, decoding base64 images, hydrating almost every page, mounting many global providers, and rendering duplicate PDP media. Reduce all of those and monitor p75 INP. Lighthouse TBT is only a lab proxy, not INP itself.

### Image and data delivery

- Run the existing base64-to-R2 migration and reject new `data:` media at write time.
- List endpoint should return one thumbnail URL, name, slug, colour, price, compare-at, availability, and minimal merchandising flags—nothing else.
- Detail endpoint should return one product only.
- Reviews should have a paginated endpoint and URL media.
- Configure strict allowed image hosts rather than `hostname: "**"`.
- Let `next/image` optimise R2 URLs. The current `unoptimized` path deliberately bypasses the framework for every base64 image. [Next.js recommends specific remote patterns and optimised responsive media](https://nextjs.org/docs/app/building-your-application/optimizing/images).

### Rendering and caching

- Convert homepage, shop, collections, story, policies, and PDP shells to Server Components.
- Fetch catalog data server-side with cache tags and 60–300 second revalidation.
- Keep filters, quick-add, gallery, size selector, cart, and review form as small client islands.
- Move providers into `(storefront)` and `(admin)` route groups and render them as deep as possible.
- Keep the backend warm or move product reads to infrastructure without cold-starts.
- Add explicit API observability: p50/p75/p95 response time, timeout count, empty-catalog fallback count.

Next.js explicitly recommends narrow Client Component boundaries to reduce shipped JavaScript; the current architecture does the opposite. See [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).

### SEO

What is good:

- Metadata base, canonical URLs, Open Graph, Twitter cards, manifest, robots, and sitemap exist.
- Product metadata and Product schema are implemented.
- Product slugs are used.

What is weak:

- Product names are absent from initial homepage HTML; eight skeletons are rendered instead.
- PDP body content is a skeleton even though metadata fetch already has the product.
- Product title in metadata is the raw generic name while the page uses a transformed premium name.
- Product schema can include founder/non-verified reviews unless filtering is aligned with storefront rules.
- Product schema lacks shipping details, return policy, colour/size variants, and merchant listing depth.
- Search and collection pages rely on client fetching.
- “Begie” remains in the canonical slug.
- No category-specific editorial copy or internal-link strategy exists.

### Technical debt and security

- Upgrade React from 19.2.3 to the current patched 19.2.x release after regression testing.
- Admin JWT fallback is stored in localStorage; remove it and use secure HttpOnly cookies only.
- CSP permits `unsafe-inline`; plan nonce-based scripts/styles.
- Remote images allow every HTTP/HTTPS host.
- Global auth calls `/auth/me` on every public visit and blocks cart readiness.
- The support chatbot, admin auth, customer auth, wishlist, cart, and drawers mount globally on every route.

## 10. Phase 8 — conversion-rate optimisation

### Why visitors leave or do not purchase

1. They cannot trust the photography to represent the real garment.
2. They cannot verify fabric quality, GSM, construction, or fit.
3. They cannot exchange the wrong size or colour.
4. The price says budget while the brand says premium.
5. There is effectively no legitimate customer proof.
6. A cold backend can show no products.
7. Shipping takes 5–10 business days with no pincode-level estimate.
8. The fit guide is generic and potentially inaccurate.
9. Permanent discounting trains users not to believe the MRP.
10. Inventory is not tracked, so availability claims are weak and overselling is possible.

### Top 20 conversion improvements, ranked

1. Offer one free size exchange and a clear seven-day return window.
2. Replace all product photography with a consistent real shoot.
3. Publish exact composition, GSM, garment measurements, model data, and construction details.
4. Eliminate backend cold-start failures and server-render the catalog.
5. Move all media to R2 URLs and reduce list payload below 100 KB.
6. Enable real variant inventory and accurate stock states.
7. Add verified-purchase reviews and post-purchase review requests.
8. Add pincode serviceability and delivery-date estimates on PDP.
9. Remove duplicated terms acceptance and simplify checkout.
10. Add labels, autocomplete, mobile keyboards, and inline validation to checkout.
11. Replace permanent fake-looking discount framing with honest pricing.
12. Add model height/chest/worn size and fit video.
13. Make product claims factual and remove unsupported “premium/heavyweight” language.
14. Show returns/exchange promise beside add-to-bag.
15. Reduce mobile PDP length and related-product repetition.
16. Add a first-order fit consultation via WhatsApp or chat with clear response hours.
17. Use real scarcity and restock messaging from inventory data.
18. Build abandoned-cart and browse-abandon email flows with consent.
19. Add analytics for view item, size select, add to cart, checkout steps, payment open, failure, and purchase.
20. A/B test proof order, CTA copy, and fit content only after reliability is fixed.

## 11. Phase 9 — premium brand transformation

### Revised positioning

**Category:** considered everyday uniforms designed in India.  
**Promise:** quiet silhouettes, transparent materials, and repeat-wear construction for Indian bodies and daily movement.  
**Tagline:** keep **“Defined Quietly.”**  
**Proof line:** “Cut for movement. Specified without mystery.”  

Do not say “luxury.” Build the evidence that makes customers say it.

### Typography

- Keep a restrained grotesk system. Manrope is serviceable but common.
- Premium route: license Neue Haas Grotesk, Söhne, or Suisse Intl.
- Cost-conscious route: retain Manrope and improve art direction, kerning, scale, and line length.
- Use the serif wordmark as the expressive contrast; do not add another decorative typeface.
- Body minimum 15–16 px; utility minimum 11–12 px; avoid 10 px critical text.

### Content strategy

Build five repeatable content pillars:

1. **Fit:** bodies, measurements, movement, styling.
2. **Material:** composition, GSM, knit, hand-feel, wash tests.
3. **Construction:** neck rib, seam, stitch, shrinkage, finishing.
4. **Uniforms in use:** real Indian customers and daily contexts.
5. **Studio notes:** sampling decisions, failures, revisions, and releases.

### Product naming system

Stop using “Green Solid Tee - Oversize.” Use a scalable architecture:

- Family: **Form**
- Style number: **01**
- Silhouette: **Oversized Tee**
- Colour: **Forest**
- Full name: **Form 01 Oversized Tee — Forest**
- SKU: `HR-F01-TEE-FOR-M`

Rename and redirect the “begie” slug. Keep permanent redirects from old URLs.

### Packaging

- FSC-certified kraft or recycled paper mailer in warm stone/black.
- One-colour wordmark; no oversized magnetic box at this price.
- Recycled tissue, paper seal, care card, and batch/QR card linking to product details and returns.
- Woven label, substantial hangtag with composition, GSM, size, country of origin, MRP, and care.
- Include a reusable exchange sleeve or simple resealable mailer.
- Avoid plastic lamination, perfume, and filler presented as “luxury.”

### Customer experience

- Dispatch within 1–2 business days; publish actual SLA.
- One free size exchange; seven-day returns.
- WhatsApp fit support during published hours.
- Automated order confirmation, dispatch, out-for-delivery, delivered, review, and care messages.
- Proactive delay communication before customers ask.
- Review request 7–10 days after delivery; NPS 14 days after delivery.
- Human escalation from chatbot in one tap.

## 12. Phase 10 — codebase audit

### Architecture

The repository has useful domain separation (`frontend`, `backend`) and reasonably named modules. It also has an over-centralised client architecture:

- 45/48 pages start with `"use client"`.
- Root layout mounts customer auth, admin auth, two modal providers, wishlist, cart, toast, theme, drawers, and support chatbot for every route.
- Public catalog reads happen in a client effect through a force-dynamic Next proxy.
- The PDP file is 1,290 lines, account is 1,693, admin product form is 1,052, and global CSS is 789.
- Storefront and admin concerns share the same global provider tree and stylesheet.

### State management

Context is adequate for a store this size, but boundaries are wrong. Cart, wishlist, auth, admin auth, theme, and dialogs should not all be global. Use route groups and purpose-specific providers. The module-level product cache is a weak substitute for server caching and disappears on reload/deploy.

### Maintainability

- Product presentation rules are duplicated between backend data, frontend normalisation, and display helpers.
- Colour dictionaries are duplicated in product card, shop, and PDP.
- Skeleton grids are duplicated.
- Product list and detail DTOs are not meaningfully separated.
- Homepage CMS data is largely disconnected from the hard-coded homepage; only announcement text is consumed in the header.
- Several fallbacks silently manufacture commercial facts instead of surfacing missing data.
- Product, cart, and wishlist surfaces use different price/name formats.

### Accessibility

Good foundations exist, especially focus styles and dialog trapping. Remaining issues:

- Checkout, tracking, and review fields rely on placeholders.
- Accordions lack expanded-state semantics.
- Carousel controls have tiny hit areas.
- A wishlist remove button is nested inside a product link.
- Utility text often falls to 10 px.
- Hidden responsive PDP trees duplicate semantic landmarks.
- Star buttons do not expose the selected rating state.
- Mobile menu does not declare `aria-expanded` or a controlled region.

### Testing gaps

Three inventory tests are not enough for a commerce system. Add:

- Product list DTO and media-size contract tests.
- Public/private product visibility tests.
- Variant stock, reservation, oversell, release, and webhook idempotency tests.
- Cart sync and guest-to-user merge tests.
- Checkout validation, duplicate submission, payment retry, and webhook signature tests.
- Returns/cancellation lifecycle tests.
- Playwright tests for home → PDP → size → cart → checkout.
- Accessibility tests for menu, drawers, modal, filter, and checkout.
- Visual regression at 390, 768, 1024, and 1440 px.

## 13. Top 50 issues ranked by severity

| Rank | Severity | Issue |
|---:|:---:|---|
| 1 | Critical | Returns are limited to damaged/defective/wrong items; no size or colour exchange |
| 2 | Critical | Cold backend can exceed 20 seconds and leave the homepage with no products |
| 3 | Critical | Catalog JSON is 1.44 MB for six products because media is base64 |
| 4 | Critical | Photography looks synthetic/composited and inconsistent across colourways |
| 5 | Critical | Material, GSM, fit, feel, weight, and construction data are empty |
| 6 | Critical | Frontend fallbacks present unsupported commercial facts as product truth |
| 7 | Critical | Inventory tracking is disabled on every live product |
| 8 | Critical | Brand claims premium while every SKU is ₹599 with permanent ₹799 strike-through |
| 9 | Critical | No credible verified customer proof |
| 10 | Critical | PDP TTFB measured 2.75 seconds before client product rendering |
| 11 | High | Hidden desktop and mobile PDP media both download |
| 12 | High | 45/48 pages are Client Components |
| 13 | High | Initial homepage HTML contains skeletons instead of product links/content |
| 14 | High | Root mounts all storefront and admin providers globally |
| 15 | High | Global auth check blocks cart readiness and creates a blank main region |
| 16 | High | “Campaign banner” placeholder is visible to customers |
| 17 | High | Generic size chart can show sizes the product does not sell |
| 18 | High | “Campaign fit shown in M” lacks model evidence |
| 19 | High | Product list endpoint includes descriptions, multiple images, reviews, and detail data |
| 20 | High | Review media is stored in product documents as base64 |
| 21 | High | Terms acceptance is duplicated in cart and checkout |
| 22 | High | Checkout steps are cosmetic; contact and shipping render together |
| 23 | High | Checkout inputs lack labels and autocomplete metadata |
| 24 | High | No pincode serviceability or delivery-date estimate |
| 25 | High | Mobile PDP is 6,735 px tall before footer |
| 26 | High | Product naming differs across metadata, PDP, cart, and cards |
| 27 | High | “Begie” remains in product name/slug source data |
| 28 | High | Homepage “heavyweight” and “substantial” claims are not supported by GSM data |
| 29 | High | Admin token fallback is persisted in localStorage |
| 30 | High | No end-to-end checkout test |
| 31 | Medium | Optimized hero is still a 506 KB PNG |
| 32 | Medium | Homepage ships roughly 663 KB JS and 105 KB CSS uncompressed |
| 33 | Medium | Hero and product photography do not belong to one campaign system |
| 34 | Medium | No back/side/detail/label/fabric-macro product media system |
| 35 | Medium | Product cards depend on hover for secondary image and quick-add discovery on desktop |
| 36 | Medium | Four related products are full-width on mobile |
| 37 | Medium | Carousel dot hit areas are approximately 6 px high |
| 38 | Medium | Product accordions lack `aria-expanded` and `aria-controls` |
| 39 | Medium | Wishlist nests a button inside a link |
| 40 | Medium | Trust badges avoid the restrictive return policy |
| 41 | Medium | Search and collection data load client-side |
| 42 | Medium | Remote image configuration allows any host |
| 43 | Medium | CSP still allows unsafe inline styles/scripts |
| 44 | Medium | Product schema review rules can diverge from visible review rules |
| 45 | Medium | Homepage CMS and storefront hero implementation are disconnected |
| 46 | Medium | Colour maps and product normalisation rules are duplicated |
| 47 | Medium | Large monolithic page/component files slow change and review |
| 48 | Medium | Footer is excessively long on mobile for such a small catalog |
| 49 | Low | Utility typography is frequently 10 px |
| 50 | Low | Visual motion ignores `prefers-reduced-motion` |

## 14. Top 50 improvements ranked by impact

| Rank | Impact | Improvement |
|---:|:---:|---|
| 1 | Transformational | Introduce seven-day returns and one free size exchange |
| 2 | Transformational | Produce a coherent real commerce and campaign shoot |
| 3 | Transformational | Complete and validate all product specification data |
| 4 | Transformational | Migrate all media to R2 URLs and ban base64 writes |
| 5 | Transformational | Make backend reads reliably warm and observable |
| 6 | Transformational | Enable variant-level inventory and truthful availability |
| 7 | Transformational | Server-render and cache home, shop, collection, and PDP data |
| 8 | Transformational | Reposition around Indian everyday uniforms with factual proof |
| 9 | Very high | Separate list and detail product DTOs; target list payload below 100 KB |
| 10 | Very high | Add product-specific garment measurements and model fit data |
| 11 | Very high | Build verified-purchase review collection and display |
| 12 | Very high | Add pincode delivery estimates and clear dispatch SLA |
| 13 | Very high | Remove unsupported fallback claims and fail validation in admin |
| 14 | Very high | Replace permanent discount posture with honest price architecture |
| 15 | Very high | Rebuild PDP as one responsive media/purchase tree |
| 16 | Very high | Simplify checkout and remove duplicate terms acceptance |
| 17 | Very high | Add checkout labels, autocomplete, input modes, and inline validation |
| 18 | Very high | Add complete payment/webhook/cart E2E tests |
| 19 | High | Replace “Campaign banner” with validated publishable announcement content |
| 20 | High | Unify product naming in the database and redirect old slugs |
| 21 | High | Convert the hero to responsive AVIF/WebP with mobile art direction |
| 22 | High | Render cart state immediately from local storage or a server cookie |
| 23 | High | Remove public auth blocking from anonymous cart readiness |
| 24 | High | Move admin and storefront into separate route groups/provider trees |
| 25 | High | Add material/process proof chapter to home and PDP |
| 26 | High | Add back, side, detail, label, macro, and fit-motion media per SKU |
| 27 | High | Limit mobile related products to two or a horizontal rail |
| 28 | High | Add web-vitals instrumentation and route-level p75 dashboards |
| 29 | High | Add structured event analytics across the funnel |
| 30 | High | Add abandonment lifecycle messaging with consent |
| 31 | Medium | Replace trust badges with linked service promises |
| 32 | Medium | Add real stock/restock messaging, never fake scarcity |
| 33 | Medium | Add WhatsApp fit support and human-chat escalation |
| 34 | Medium | Add real checkout step isolation or relabel as one-page checkout |
| 35 | Medium | Improve Product schema with variants, shipping, and return policy |
| 36 | Medium | Align visible and structured-data review eligibility |
| 37 | Medium | Add category/editorial content and internal links |
| 38 | Medium | Refactor PDP, account, and admin form into domain components |
| 39 | Medium | Centralise colour tokens, naming, pricing, and presentation rules |
| 40 | Medium | Add admin completeness score and block publishing incomplete products |
| 41 | Medium | Add media focal-point/crop controls in admin |
| 42 | Medium | Add accessible accordion and carousel semantics |
| 43 | Medium | Fix nested interactive markup in wishlist |
| 44 | Medium | Increase utility text minimum and footer tap areas |
| 45 | Medium | Restrict image remote patterns to owned hosts |
| 46 | Medium | Replace localStorage admin token with HttpOnly cookie-only auth |
| 47 | Medium | Add nonce-based CSP plan and remove unsafe-inline over time |
| 48 | Medium | Honour reduced-motion preferences |
| 49 | Low | Document design tokens, spacing scale, and component states |
| 50 | Low | Add visual regression tests for key responsive breakpoints |

## 15. Delivery plan

### Quick wins — less than one day

- Replace “Campaign banner.”
- Remove unsupported “heavyweight” wording until GSM is entered.
- Remove one of the two terms checkboxes.
- Add labels/autocomplete/input modes to checkout and tracking.
- Reduce related products on mobile to two.
- Add `aria-expanded`, carousel hit areas, and fix nested button/link markup.
- Remove fake fallback compare-at pricing where no compare-at value exists.
- Correct “Begie” display data and prepare a redirect plan.
- Add a visible returns/exchange statement beside add-to-bag.
- Add Sentry/log alerts for catalog timeouts and empty results.

### Medium improvements — one to seven days

- Run the base64 media migration to R2 and reject data URIs.
- Create slim list DTO and paginated review API.
- Enable and populate variant inventory.
- Populate fabric, GSM, construction, fit, care, and real measurements.
- Refactor home/shop to server data with cache/revalidation.
- Refactor PDP into server shell plus client purchase/gallery islands.
- Split admin/storefront providers.
- Fix cart hydration and anonymous auth blocking.
- Instrument web vitals and funnel events.
- Add E2E happy-path and payment retry tests.

### Major improvements — one to four weeks

- Change return/exchange operations and train support.
- Complete the two-day shoot and media production pipeline.
- Rebuild positioning, naming, product copy, and campaign content.
- Implement pincode ETA/serviceability.
- Build verified-review automation.
- Rebuild homepage around proof, fit, process, and campaign.
- Refactor monolith files and formalise the design system.
- Harden auth, CSP, media host configuration, and webhook observability.

## 16. Exact plan to reach 9.5/10 premium status

A 9.5/10 interface is achievable in four weeks. A 9.5/10 brand requires the product and operations to become equally good.

### Gate 1 — truth before taste (days 1–3)

- Stop unsupported claims.
- Complete every SKU field.
- Enable inventory.
- Approve customer-friendly returns/exchanges.
- Define dispatch and support SLAs.
- Success gate: no product can publish without composition, GSM, measurements, care, stock, media set, and return eligibility.

### Gate 2 — reliability before traffic (days 2–7)

- Move media to R2.
- Reduce product list below 100 KB.
- Remove cold-start failure.
- Server-render catalog and PDP.
- Add monitoring and E2E checkout tests.
- Success gate: p95 catalog API below 500 ms warm, zero empty-catalog fallbacks, PDP server TTFB below 800 ms, and no duplicate responsive media downloads.

### Gate 3 — one visual world (days 4–12)

- Shoot the full commerce and campaign system.
- Retouch consistently and publish AVIF/WebP derivatives.
- Replace every composited/colour-replaced image.
- Success gate: every SKU has the same shot list, crop logic, model metadata, and colour accuracy review.

### Gate 4 — conversion confidence (days 8–16)

- Rebuild PDP proof order.
- Add pincode ETA, fit video, real size data, exchange/return promise, and verified reviews.
- Simplify cart and checkout.
- Success gate: users can answer “Will it fit?”, “What is it made of?”, “When will it arrive?”, and “Can I return it?” without opening another page.

### Gate 5 — ownable brand system (days 10–21)

- Finalise positioning, naming, copy voice, content pillars, and packaging.
- Rebuild homepage and story with real process proof.
- Success gate: remove the logo and a customer should still recognise HRUSHE from silhouette, palette, photography, copy, and proof style.

### Gate 6 — measure and iterate (days 18–30)

- Instrument p75 LCP, CLS, INP, funnel, payment failure, return reason, size exchange, and support contact reason.
- Run usability sessions with at least eight target customers on mobile.
- Fix the top five observed breakdowns before any aesthetic A/B test.
- Success gate: good Core Web Vitals at p75, no critical accessibility failures, reliable purchase completion, and measurable reduction in size/fit hesitation.

### 9.5/10 acceptance criteria

- Real and coherent photography across every surface.
- Complete, factual product data with no invented fallbacks.
- Customer-friendly returns and size exchange.
- Real inventory, reliable delivery estimates, and verified reviews.
- Catalog always renders without client waiting.
- Good Core Web Vitals at the 75th percentile.
- One product name, price, and policy across every channel.
- WCAG 2.2 AA for the purchase journey.
- No base64 product media, hidden duplicate galleries, or global admin/storefront provider bundle.
- A differentiated Indian point of view, not a better copy of COS.

## Final verdict

The redesign has moved HRUSHE out of “generic template store” territory, but not into premium brand territory. The site currently over-promises and under-proves. The path forward is not more minimalism. It is evidence: better product, honest specifications, coherent photography, customer-friendly risk reversal, reliable commerce infrastructure, and a point of view rooted in India rather than borrowed from European retail.

Keep “Defined Quietly.” Earn it.

---

## 17. Phase 11 — admin dashboard audit

### Admin readiness score: 4.3/10

The admin dashboard has an unusually broad and polished interface for this stage of the business, but breadth is disguising a much smaller operational core. Product CRUD, order status updates, customer lookup, review moderation, support tickets, media upload, and staff-role assignment have real backend paths. Several other modules are presentation-only, store data in a shared generic document, or imply capabilities that the storefront and checkout do not consume.

The live unauthenticated test correctly returned `401` for `/admin/customers`. Visiting `/admin` stays on that URL and opens a client-side login modal rather than rendering protected data. I did not use admin credentials, so authenticated visual QA is based on the complete route/component implementation rather than a live production session.

### Module-by-module verdict

| Module | Current state | Finding | Production verdict |
|---|---|---|---|
| Dashboard overview | Real orders/customers plus client-calculated metrics | Clear commercial summary, but it downloads complete order and customer datasets and calculates analytics in the browser | Useful for a tiny catalog; not scalable |
| Product creation/editing | Real product CRUD | Broad form, image/video support, variants, draft/active states, and a client-side publishing checklist | Operational, but server validation is too weak |
| Product media | Authenticated raw upload to R2 when configured, otherwise GridFS | Product images are compressed and uploaded; MIME allowlist and 25 MB limit exist | Partial pass; no lifecycle, transform, or deletion system |
| Homepage banners | Draft/publish UI in the shared admin workspace | Scheduling, ordering, preview, image/video fields exist | Fails operationally: the live homepage hero remains hardcoded |
| Collections | Descriptive `AdminModulePage` only | No collection records, CRUD, product association, ordering, landing page, or API | Placeholder |
| Orders | Real order records and status update endpoint | Search, payment state, invoice, courier, tracking, and timeline are visible | Partial pass; shipping/refund metadata is split from the order |
| Customers | Real customer and order lookup | Profiles, addresses, wishlist, preferences, and value segments are useful | Partial pass; “Block customer” is cosmetic and not enforced |
| Coupons | Editable records in shared workspace | Code, type, value, expiry, limit, and customer email fields exist | Non-functional commerce feature; checkout never validates or applies coupons |
| Inventory | Real variant stock read from products | Available/reserved/low-stock views are useful; editing sends admin back to the product form | Partial pass; no adjustment ledger, stock import, warehouse, or alerts |
| Shipping | Order list plus manual courier/tracking fields | Can record courier and tracking URL | Manual board only; no shipment creation, label, webhook, NDR, or courier sync |
| Returns/exchanges | Descriptive `AdminModulePage` only | The page says the pipeline is “ready” but contains no request records or actions | Placeholder |
| Reviews | Real moderation endpoints | Approve/reject/hide works against product reviews | Operational, though reporting and abuse controls are thin |
| Support | Real ticket endpoints | One of the stronger operational modules | Partial pass; no SLA, assignment, macros, escalation, or customer-visible thread state |
| Reports | Client-computed charts and CSV | Revenue, products, customers, orders, and coupon exports appear complete | Misleading: no date controls, paid-order basis, tax/refund accounting, server export, or real coupon use |
| Roles | Real staff creation and role assignment | Four understandable role presets and server-side permission checks | Good foundation; needs MFA, audit logs, session control, and fail-closed defaults |
| Content/settings/audience/announcements/storefront | Mostly shared-workspace records or descriptive pages | Several settings and content fields are not consumed by public pages | Partly decorative admin surface |

### Critical workflow defects

1. **Homepage publishing does not publish the homepage hero.** The admin writes `homeManagement.banners`, and `/content/homepage` exposes the first scheduled banner, but `frontend/app/page.tsx` hardcodes the hero image, copy, and CTAs. Only the site header consumes `announcementText`. An admin can receive “Homepage banners published” while customers continue seeing the hardcoded campaign.
2. **The current live homepage-content response is 788,598 bytes.** The active banner is a base64 JPEG stored in MongoDB. The header fetches that payload globally to render a short announcement, while the homepage ignores the returned hero. This is duplicate work and a severe performance/data-model defect.
3. **Coupons are records, not discounts.** They have no checkout validation, pricing calculation, redemption transaction, per-customer enforcement, or order snapshot. The default `HRUSHE10` and usage counts are effectively sample content.
4. **Returns and exchanges do not exist.** There is no return model, API, request form, inspection flow, item state, reverse shipment, exchange order, refund provider call, or reason reporting.
5. **Customer blocking is visual metadata only.** The flag is stored in `adminWorkspace.customerMeta`; authentication, cart, checkout, support, and order routes never check it.
6. **Refund completion is a UI flag.** The order screen changes `refundState` in the shared workspace but does not initiate or verify a Razorpay refund and does not update a financial ledger.
7. **Order truth is split.** `orderStatus`, courier, and tracking live on `Order`; shipping status, updates, return pickup, and refund state live under `SiteContent.adminWorkspace.orderMeta`. One operational event requires two writes, and partial failure can leave conflicting states.
8. **Product truth is also split.** Status, fit, labels, and gallery information exist in both `Product` and `adminWorkspace.productMeta`. This creates migration logic and stale-state risk without a business reason.

### Validation and data-quality risks

- The active-product launch checklist exists only in the React form. Direct API requests can publish a product without images, colours, sizes, fabric, GSM, wash care, size measurements, or inventory.
- Bulk upload accepts pasted JSON and creates products sequentially without schema preview, row-level validation, rollback, deduplication, or an import report. A failure midway leaves a partial import.
- Coupon values allow invalid combinations such as percentage values above 100, negative-equivalent semantics, zero usage limits, past expiry, duplicate codes, and malformed customer email.
- Banner URLs and CTA paths are not constrained to safe schemes/internal routes; schedule end can precede schedule start.
- Product videos reject embedded base64, but banner images and video posters are still compressed into data URLs and saved inside the shared MongoDB document.
- Inventory SKU uniqueness is enforced only within one product, not across the catalog.
- Order status transitions are not state-machine controlled. An admin can move directly from Delivered back to Pending or mark an unpaid order Delivered.
- Shipping tracking URLs are free text, with no URL validation or courier consistency.

### Admin UX findings

What works:

- Clear grouped navigation, global search, contextual quick-create, consistent cards, badges, filters, empty states, and destructive confirmations.
- Permission-aware navigation and route messaging reduce accidental access.
- Product forms expose the important apparel fields and variant matrix in one place.
- Order detail brings customer, line items, fulfillment, invoice, timeline, and tracking together.
- The unauthenticated admin and customer login pages had no horizontal overflow at 390 px.

What needs redesign:

- The left navigation contains too many low-value or placeholder destinations. “Storefront,” “Homepage,” “Announcements,” “Collections,” “Audience,” and “Content” overlap conceptually.
- Labels such as “Ready,” “Supported,” “Future-ready,” and “Placeholder” make the interface look more complete than the system is.
- Mobile uses one long navigation drawer containing every module. High-frequency work needs role-based shortcuts, a compact bottom action bar, and task queues.
- Desktop lists download and render every record. There is no pagination, saved view, bulk fulfillment, bulk label generation, keyboard workflow, or column configuration.
- Inventory edits require leaving the inventory page and opening each product.
- Order status and shipping status are separate dropdowns without a clear dependency model.
- Homepage image upload gives immediate local feedback, but publishing can write hundreds of kilobytes of base64 into MongoDB with no warning.
- There is no unsaved-changes protection, content versioning, approval state, preview URL, scheduled-job status, or rollback.
- Notifications are represented by a bell button with no notification center or event feed.

### Security and governance risks

- Admin bearer tokens are persisted in `localStorage`, increasing the impact of any XSS defect.
- Admin login uses the same seven-day JWT and primary login endpoint as customers, with no MFA, passkey, device verification, IP/risk signal, or shorter privileged session.
- The page boundary is client-side only. The API correctly denies unauthorized data, but there is no server middleware redirect or server-rendered authorization gate.
- Every admin can read the entire `adminWorkspace` document even when their role cannot mutate all of its keys. Read access is broader than the role design suggests.
- There is no immutable audit log for product publication, price changes, order changes, refund decisions, role changes, customer blocking, content publication, or exports.
- No dual approval is required for refunds, destructive catalog actions, role escalation, or production publishing.

### Scalability problems

- `/order/all`, `/admin/customers`, and `/products` are unpaginated. The browser downloads all records for dashboard, lists, and reports.
- Customer summaries load all customers and all orders, then group and sort them in application memory.
- Reports use browser memory and Blob-based CSV generation rather than asynchronous server exports.
- One `SiteContent` document stores banners, categories, product metadata, order metadata, customer metadata, coupons, pages, media library, moderation, settings, roles, and shipping settings. Concurrent admins can overwrite each other, the document will grow indefinitely, and unrelated updates invalidate the same document.
- Client caches are module globals with 45–60 second TTLs and no mutation-aware invalidation across tabs or staff members.
- The media library has no server-side listing, ownership reference, soft deletion, usage check, or orphan cleanup.

### Ideal HRUSHE admin structure

1. **Command center** — paid revenue, orders needing action, payment failures, low stock, returns awaiting review, support SLA, and publish status.
2. **Commerce** — Orders, Fulfillment, Shipments, Returns & Exchanges, Refunds, and Payment Reconciliation.
3. **Catalog** — Products, Variants & Inventory, Collections, Categories, Media, and Reviews.
4. **Storefront** — Homepage composer, Navigation, Announcement bar, Content pages, SEO, Preview, Schedule, and Publish history.
5. **Customers** — Profiles, Segments, Support context, Consent, and enforced account status.
6. **Growth** — Coupons, Campaigns, Newsletter, Audiences, and attribution.
7. **Insights** — Sales, Products, Inventory, Returns, Customers, Tax, and downloadable reports.
8. **System** — Staff, Roles, Audit log, Integrations, Shipping settings, Payments, Domains, and environment health.

Default each role to a task-specific home: operations sees fulfillment exceptions; catalog sees incomplete products and stock; growth sees campaign performance; super admin sees system health. Hide non-functional modules until they work.

## 18. Phase 12 — login and authentication audit

### Auth readiness score: 5.4/10

Customer authentication is usable and has a reasonable base: HttpOnly cookies, secure production cookies, hashed passwords, hashed OTPs, generic forgot-password request messaging, rate limits, protected APIs, and server-side role/permission checks. The largest risks are privileged token storage, missing admin MFA, stateless sessions without revocation, non-cryptographic OTP generation, and a role default that fails open to Super Admin.

### Flow review

| Flow | Current implementation | Verdict |
|---|---|---|
| Customer login | Email or Indian phone plus password | Simple and understandable; server errors are mostly user-friendly |
| Customer signup | Name, email, phone, email OTP, password, confirm password | Secure enough for email verification but long: six fields and 2,330 px on tested 390 px mobile page |
| Customer OTP login | Not implemented | Missing; OTP is used only for signup verification and password reset |
| Admin login | Username/email alias plus password through the customer auth endpoint | Too weak for privileged access |
| Forgot password | Email request, six-digit OTP, new password | Good basic UX; needs stronger attempt/session controls |
| Session persistence | Seven-day JWT in secure HttpOnly cookie; admin also stores bearer JWT locally | Persistent, but not revocable and overexposed for admins |
| Role-based access | Backend permission middleware plus client navigation filtering | Good foundation; read boundaries and defaults need hardening |
| Protected routes | Customer APIs are protected; admin APIs enforce role/permission; admin page uses a client modal guard | Data boundary works, page boundary is soft |
| Unauthorized behavior | Admin API returns `401`; `/admin` remains visible as a route with login modal | Safe for data, less clear than a server redirect to `/admin/login` |

### Security findings

1. **Admin JWT in `localStorage` — high.** `sendAuthResponse` returns the JWT in JSON and `admin-auth.ts` persists it. Remove the token from response bodies and use only an HttpOnly, Secure cookie.
2. **No admin MFA — high.** A password alone protects product prices, customer PII, orders, staff roles, and future refunds. Require passkey/WebAuthn or TOTP, with recovery codes and step-up authentication for refunds and role changes.
3. **OTP generation uses `Math.random()` — high.** Generate OTPs with `crypto.randomInt`, store a purpose-bound hash, count attempts, and invalidate after a small number of failures.
4. **Missing/invalid admin roles default to Super Admin — high.** `normalizeAdminRoleId` and `getAdminRoleForUser` fall back to `super-admin`. Authorization must fail closed to no permissions or an explicitly migrated role.
5. **Production JWT secret can silently become `development-secret` — high.** Startup validates admin credentials but not `JWT_SECRET`. Fail startup when secrets, cookie policy, payment secrets, or database configuration are absent or unsafe.
6. **No session revocation — medium/high.** Password change, password reset, logout, staff disablement, and suspected compromise do not invalidate an already stolen JWT. Add session records/token version, rotation, device list, and revoke-all.
7. **Seven days is too long for privileged sessions — medium.** Use 8–12 hours for admin with 15–30 minute inactivity lock and step-up authentication for sensitive actions.
8. **`SameSite=None` is unnecessary behind the same-origin Next proxy — medium.** Prefer `Lax` or `Strict` and add explicit CSRF protection for state-changing cookie-authenticated requests.
9. **Admin workspace read access is not permission-scoped — medium.** Any admin can fetch customer notes, coupons, settings, shipping configuration, and other role-irrelevant data.
10. **Rate limits are in-memory and IP-only — medium.** They reset on restart and do not coordinate across instances. Add Redis-backed limits keyed by IP plus normalized account identifier, and progressive lockouts/alerts for admin login.
11. **Phone has no unique database index — medium.** Application prechecks can race. Add a partial unique index for non-empty normalized phone numbers.
12. **Legacy login upgrades unverified accounts after a correct password — medium.** Complete the migration explicitly and remove the permanent verification bypass.
13. **Unvalidated `next` query parameters — medium.** Login/signup/admin navigation should accept only internal allowlisted paths, never arbitrary schemes or external origins.
14. **CSP contains `'unsafe-inline'` for scripts — medium.** This magnifies the consequence of localStorage token use. Move to nonces/hashes and eliminate the admin bearer token first.

### UX findings

- Customer login is compact, clear, and works without horizontal overflow at 390 px.
- Customer signup is understandable but unnecessarily asks for phone before it is needed and requires password plus email OTP. It is a long mobile task.
- Signup catches some backend errors and replaces them with “Could not create your account,” hiding actionable reasons such as duplicate email or phone.
- There is no resend countdown, OTP attempt indicator, paste/autofill optimization, `autocomplete="one-time-code"` evidence, or clear email-correction flow.
- Admin login labels the field “Username” even though the system is primarily email-based and exposes the existence of an “admin alias.” Use “Work email,” do not advertise aliases, and separate privileged login from customer login.
- A customer admin account entered in the customer login fails as if credentials are wrong. That avoids role crossover but should send staff to the correct portal without revealing sensitive role detail.

### Recommended customer account and login strategy

- Allow guest checkout and ask for account creation after purchase; never force signup for conversion.
- Use **email OTP/passwordless login as the primary low-friction option**, with email/password as a secondary fallback. Add phone OTP only after MSG91 delivery, consent, abuse prevention, and DLT templates are production-verified.
- At signup, request email first, verify it, then ask only name and password if the customer chooses password login. Collect phone and delivery address during checkout.
- Merge guest orders into the account after verified email/phone ownership.
- Account structure: Overview, Orders & tracking, Returns/exchanges, Addresses, Wishlist, Profile & fit preferences, Communication preferences, and Security/sessions.
- Keep authentication error messages specific for validation but generic for account existence. Preserve entered fields after recoverable errors.

### Recommended admin role and session strategy

- `Super Admin`: integrations, roles, finance/refunds, publishing, and all operations.
- `Operations`: orders, fulfillment, shipping, returns, support; no catalog price or role access.
- `Catalog`: products, variants, inventory, collections, media; no customer export or refunds.
- `Growth`: homepage/content, coupons, campaigns, reviews, aggregate reports; customer PII only when explicitly needed.
- Add `Finance/Support` as separate least-privilege roles when staff grows.
- Require MFA for every admin, reauthentication for refund/role/export actions, session/device management, immutable login/audit events, and immediate disable/revoke capability.

## 19. Phase 13 — backend and API audit

### Scorecard

| Area | Score | Verdict |
|---|---:|---|
| Backend | 5.1/10 | Sensible small Express app with real commerce logic, but operational domains are incomplete |
| API | 4.8/10 | Core routes exist; pagination, versioning, contracts, and entire business domains are missing |
| Security | 5.0/10 | Strong headers and payment signatures offset by admin token, secret, webhook, CSRF, and session risks |
| Database | 4.5/10 | Product/order snapshots are reasonable; indexes and the monolithic workspace are not |

### What is technically sound

- Checkout ignores browser-supplied product copy and price, reloads canonical products, validates selected options, limits quantities, and calculates totals server-side.
- Inventory reservations use conditional MongoDB updates and release partially reserved items on failure.
- Razorpay checkout signatures use HMAC and timing-safe comparison.
- Webhook raw-body capture is installed before JSON parsing.
- Passwords and OTPs are hashed; forgot-password request messaging avoids basic account enumeration.
- Admin mutation routes use server-side permission middleware; live unauthorized access returned `401`.
- CORS is restricted in production, security headers are present, `x-powered-by` is disabled, and production HSTS is configured.
- Product review visibility and unpublished-product access are server-controlled.
- Orders snapshot product name, price, selected option, and SKU, which protects historical accuracy.

### Broken, unsafe, or misleading behavior

#### Payments and orders

- Razorpay webhook verification is conditional. If `RAZORPAY_WEBHOOK_SECRET` is empty, the endpoint accepts unsigned events. Production must fail startup without it.
- `/order/checkout/failure` and `/order/checkout/cancel` can mutate an unpaid order using only its MongoDB ID; they do not require a signed state token, authenticated owner, or provider signature.
- Payment verification records payment IDs only inside a mixed checkout log; there are no first-class provider payment/refund IDs, captured amount, fee, tax, settlement, or reconciliation fields.
- There is no idempotency key on checkout creation and no unique index on `checkoutSessionId`. Retries can create duplicate Razorpay orders and internal orders.
- Status transitions are unconstrained and do not enforce payment/fulfillment invariants.
- The legacy authenticated `/order/place` endpoint creates an unpaid order and clears the cart without the inventory reservation/payment path. It should be removed or isolated for an explicit COD flow.
- Checkout logs duplicate the full shipping object and store entire webhook payloads in each order, increasing PII exposure and document growth.
- Return, exchange, refund, cancellation-reason, tax, discount, shipping-charge, and fulfillment entities are absent.

#### Products, content, and media

- Public catalog payloads remain enormous because historical media is embedded as base64. Six products transferred 1,441,175 bytes; the current homepage-content payload transferred 788,598 bytes.
- The public product list has no `limit`, cursor, projection version, ETag, or CDN-safe immutable media strategy. A process-local 60-second cache does not help across instances.
- Active-product completeness is not enforced by the API/model. The browser form is the only publishing gate.
- `SiteContent.adminWorkspace` is an untyped `Mixed` object serving as a database for unrelated domains.
- Homepage banner images and posters are written as base64 even though product media uses the upload API.
- R2 integration is all-or-nothing and silently falls back to GridFS. The checked-in `render.yaml` declares Razorpay variables but no R2 variables, so Blueprint deployments will not configure R2 unless operators add them manually.
- Uploads trust the declared MIME type; there is no magic-byte inspection, malware scan, image dimension/pixel limit, transcoding, thumbnail generation, moderation, or delete endpoint.
- Direct hosted media URLs can point to arbitrary origins. There is no allowlist, ownership proof, or asset reference tracking.
- Public content pages, settings, collections, coupons, and navigation do not have normalized public APIs; many admin edits cannot reach the storefront.

#### Validation and error handling

- Validation is handwritten and inconsistent across controllers. There is no shared schema layer for request body, query, params, or response contracts.
- Strings generally lack maximum lengths; arrays and mixed objects can grow until the 5 MB body limit.
- Email, phone, address, URL, date, coupon, and product rules differ by endpoint.
- Mongoose errors are normalized, but unknown operational errors can expose internal messages to clients.
- There is no API versioning, request ID, machine-readable error code, field-error map, or documented OpenAPI contract.
- Public search builds regular expressions. Input is escaped, which is good, but pagination and query cost controls are missing.

#### Logging, observability, and reliability

- Logging is plain `console` output without structured request context, redaction policy, trace ID, severity routing, or alerting.
- There are no health/readiness endpoints that verify MongoDB, R2, Razorpay configuration, and mail delivery separately.
- No metrics exist for checkout creation, payment verification, webhook lag, inventory reservation, mail failure, API latency, or error rate.
- The inventory cleanup is an in-process `setInterval`. It stops during downtime, runs once per scaled instance, processes only 50 rows per pass, and has no distributed lock.
- Rate limiting is also process-local and loses state on restart/scale.
- Email is sent inline on request paths instead of through a durable queue/outbox.
- The frontend proxy has no upstream timeout, circuit breaker, or response-size guard.

#### Database and query design

- `Order` needs indexes for `{userId, createdAt}`, `{createdAt}`, `{orderStatus, createdAt}`, `{paymentStatus, createdAt}`, `checkoutSessionId`, `customerEmail`, and reservation expiry/status.
- `User` needs a normalized partial unique phone index and operational indexes for role/adminRole and created date where queried.
- `Product` needs query-specific indexes for status/category/flags/created date and a catalog-wide unique SKU strategy if SKUs are operational identifiers.
- `SupportRequest` needs status/priority/assignee/updated-date indexes; newsletter and verification indexes should be reviewed for case normalization and abuse workflows.
- Customer listing loads all users and all orders, then aggregates in Node. Replace with paginated aggregation or maintained customer metrics.
- Orders, products, support requests, reviews, and customers have no cursor pagination.
- There are only three automated backend tests, all for checkout selection normalization. No auth, authorization, payment, webhook, order ownership, inventory concurrency, admin, upload, or integration tests exist.

### Missing endpoints

Priority endpoint families required for production:

- `GET /admin/dashboard?range=` — server-computed paid revenue and exception counts.
- `GET /admin/orders?cursor=&status=&payment=&q=` and bulk fulfillment endpoints.
- `GET /admin/customers?cursor=&segment=&q=` plus enforced `PATCH /admin/customers/:id/status`.
- `/collections` CRUD, product association, sort order, publication, and collection landing data.
- `/coupons` CRUD, `POST /coupons/validate`, checkout pricing/application, atomic redemption, and redemption history.
- `/inventory/levels`, `/inventory/adjustments`, `/inventory/reservations`, low-stock rules, and import/export.
- `/shipments` create/cancel/label/track plus courier webhook and NDR actions.
- `/returns` request, approve/reject, pickup, receive, inspect, exchange, and complete.
- `/refunds` initiate/status plus Razorpay refund webhook and reconciliation.
- `/media` list, metadata, usage, delete/restore, presigned upload, and transform variants.
- `/content/banners` draft/preview/publish/version/rollback and `/content/pages/:slug` public delivery.
- `/admin/reports/*` asynchronous exports with date, payment, refund, tax, and timezone filters.
- `/admin/audit-logs` with actor, action, before/after, IP, request ID, and target.
- `/auth/sessions`, revoke session/revoke all, admin MFA enrollment/challenge/recovery, and staff disablement.
- Idempotent payment/refund webhooks with stored event IDs and replay-safe processing.

### Exact refactor plan

**P0 — before accepting real money**

1. Fail startup when production JWT, admin, MongoDB, Razorpay key/secret/webhook secret, cookie, client URL, mail, and chosen media-store settings are unsafe or missing.
2. Remove JWTs from JSON/localStorage; use one HttpOnly cookie session strategy and CSRF protection.
3. Require admin MFA and make RBAC defaults fail closed.
4. Sign checkout failure/cancel state, require ownership where applicable, and make payment/webhook processing idempotent.
5. Remove or disable legacy `/order/place`; add explicit payment/refund/reconciliation fields and unique indexes.
6. Migrate every base64 product/banner/review asset to R2, reject new data URLs server-side, and split announcement delivery from hero media.
7. Wire the homepage to published banner data or remove the admin publisher until it is real.
8. Enforce active-product completeness and inventory rules on the backend.

**P1 — operational launch**

1. Extract Coupon, Collection, Shipment, Return, Refund, MediaAsset, AuditLog, and AdminSession models.
2. Move order/shipping/refund state into domain records and remove `orderMeta`; move all product truth into Product and remove `productMeta`.
3. Add cursor pagination, field projections, query indexes, and server aggregation for every admin list/report.
4. Add schema validation with bounded strings/arrays and a standard error contract.
5. Add durable jobs for email, reservation expiry, media processing, exports, and webhook retries.
6. Implement structured redacted logs, request IDs, metrics, tracing, readiness checks, and alerts.

**P2 — scale and maintainability**

1. Version the API and publish an OpenAPI contract; generate shared frontend types.
2. Introduce repository/service boundaries per domain and MongoDB transactions where multi-document invariants require them.
3. Add media derivatives, CDN rules, lifecycle cleanup, and reference-safe deletion.
4. Add full integration, authorization-matrix, webhook replay, inventory concurrency, and end-to-end checkout tests.
5. Build asynchronous finance/operations reports from paid and refunded events rather than browser calculations.

### Recommended backend folder structure

```text
backend/src/
  app.js
  server.js
  config/
    env.js
    database.js
    security.js
  infrastructure/
    mongo/
    queue/
    cache/
    storage/r2/
    payments/razorpay/
    shipping/
    email/
    observability/
  middleware/
    authenticate.js
    authorize.js
    csrf.js
    validate.js
    rate-limit.js
    request-context.js
    error-handler.js
  modules/
    auth/
      auth.routes.js
      auth.controller.js
      auth.service.js
      auth.schemas.js
      session.model.js
    catalog/
      product.*
      collection.*
      inventory.*
    checkout/
      checkout.*
      pricing.*
      coupon.*
      reservation.*
    orders/
      order.*
      shipment.*
      return.*
      refund.*
    customers/
    content/
    media/
    reviews/
    support/
    reporting/
    admin/
      staff.*
      audit-log.*
  jobs/
  shared/
    errors/
    validation/
    pagination/
    idempotency/
  tests/
    unit/
    integration/
    contract/
    e2e/
```

Each module should own its schema, validation, authorization policy, service, repository/query layer, routes, events, and tests. Controllers should translate HTTP only; payment, inventory, and fulfillment rules belong in services with transaction/idempotency boundaries.

## 20. Phase 14 — full system readiness

### Production readiness scorecard

| Dimension | Score | Verdict |
|---|---:|---|
| Design readiness | 6.4/10 | Strong visual direction; weak proof, photography, states, and policy UX |
| Frontend readiness | 5.6/10 | Core journey exists; client-heavy loading, duplicated media trees, and data failures remain |
| Backend readiness | 5.1/10 | Real checkout logic, but incomplete operations, observability, contracts, and scale controls |
| Admin readiness | 4.3/10 | Product/order basics work; many business-critical modules are cosmetic or fragmented |
| Auth readiness | 5.4/10 | Customer baseline is acceptable; admin/session hardening is not |
| Payment readiness | 5.6/10 | Signature and canonical pricing foundations are good; deployment, idempotency, refund, and reconciliation gaps remain |
| Launch readiness | 4.2/10 | **No-go for a public paid launch or scaled campaign** |

### Can HRUSHE serve real customers today?

| Capability | Answer | Reason |
|---|---|---|
| Browse products | Partly | Products are public and usable when warm; cold backend timeout and 1.44 MB catalog can empty the grid |
| Add to cart | Yes, with caveats | Cart UI and authenticated server cart exist; inventory is disabled on the live catalog |
| Checkout | Demonstrable, not release-grade | Server reprices items and creates Razorpay checkout, but launch configuration and failure/idempotency controls need closure |
| Admin manage products | Partly | CRUD and media work; publish rules are client-only and live data is incomplete |
| Admin manage homepage banners | No | The publisher updates API data, while the actual homepage hero is hardcoded |
| Admin update orders | Partly | Core status/courier/tracking updates work; shipping/refund detail is fragmented and manual |
| Payments work safely | Not yet proven | No production evidence for keys/webhook/reconciliation/refunds; webhook secret is optional in code |
| Images/videos upload reliably | Partly | Authenticated upload exists; R2 is absent from Blueprint config, images still enter MongoDB as base64, and media lacks lifecycle tooling |
| Track order status | Yes, manually | Customer tracking and admin fields exist, but there is no courier sync or event validation |
| Customer support handle issues | Partly | Tickets exist; no mature assignment/SLA/escalation and no linked returns workflow |
| Returns/exchanges managed | No | Policy, model, customer flow, admin workflow, reverse logistics, and refund integration are absent |

### Launch decision

Do not send paid traffic or announce a broad public launch in the current state. A tightly controlled friends-and-family or staff beta is reasonable only after the P0 payment/auth/media fixes and with manual order monitoring. The risk is not merely cosmetic: customers can encounter an empty catalog, admins can “publish” changes that do not reach the storefront, and support has no system for the post-purchase problems most common in apparel.

### Step-by-step production plan

#### Step 1 — freeze false surfaces and define one source of truth (day 1)

- Hide Collections, Returns, Audience, announcements scheduling, coupons, refunds, and any “Ready” modules until they are functional.
- Define canonical ownership for Product, Order, Shipment, Return, Coupon, Content, and Media.
- Remove duplicated `productMeta`, `orderMeta`, and customer blocking metadata or mark them migration-only.
- Replace the public announcement “Campaign banner” immediately.

**Gate:** every visible admin control has an observable customer or operational outcome.

#### Step 2 — secure identity and production configuration (days 1–3)

- Fail-fast validate all production secrets and integrations.
- Move admin auth to HttpOnly cookies; add CSRF, MFA, fail-closed roles, staff disablement, and session revocation.
- Use cryptographic OTPs and distributed/account-aware limits.
- Constrain login return paths to internal routes.

**Gate:** authorization-matrix tests prove customers cannot access admin data and each staff role can access only its intended reads and writes.

#### Step 3 — make media and catalog reliable (days 1–5)

- Configure R2 explicitly in deployment; migrate and verify all base64 assets.
- Reject data URLs in every product, review, banner, poster, and content field.
- Generate AVIF/WebP derivatives and thumbnails; add references and deletion safety.
- Enforce active-product completeness, catalog-wide SKUs, real inventory, and factual garment data server-side.
- Server-render or cache the first catalog page so a cold API never empties home/shop.

**Gate:** public product JSON is measured in tens of kilobytes, not megabytes; cold catalog/PDP requests stay within the frontend budget.

#### Step 4 — close payment and order integrity (days 3–7)

- Make Razorpay webhook secret mandatory, add event idempotency, unique checkout references, signed cancel/failure state, and provider payment verification/reconciliation.
- Remove the legacy unpaid order path.
- Model totals as subtotal, discount, shipping, tax, refund, and grand total; store currency in minor units.
- Add legal invoice fields and test success, failure, abandoned, duplicate callback, delayed webhook, and partial outage scenarios.
- Add monitoring and an admin payment exception queue.

**Gate:** automated tests prove no duplicate order/charge, no client price tampering, no oversell, and safe replay of every payment event.

#### Step 5 — build the minimum operational admin (days 5–12)

- Add paginated order/customer/product queues with saved filters and bulk actions.
- Consolidate order, shipment, tracking, and history into one backend workflow.
- Add enforced customer status, staff notes, assignment, and audit logs.
- Wire the homepage hero to versioned publish data with preview and rollback.
- Add low-stock alerts and an inventory adjustment ledger.

**Gate:** one trained operator can publish a product, change the homepage, fulfill an order, answer a ticket, and trace every change without database access.

#### Step 6 — implement apparel post-purchase operations (days 8–16)

- Finalize a customer-friendly return and size/colour exchange policy.
- Build customer request, item/reason/photo capture, eligibility, approval, reverse pickup, inspection, exchange inventory, Razorpay refund, and notification states.
- Integrate a shipping provider for serviceability, label/AWB, tracking webhooks, NDR, and reverse pickup.
- Expose accurate progress in customer accounts and support.

**Gate:** a real test order completes delivery, exchange, return pickup, and refund with matching admin, customer, payment, and inventory records.

#### Step 7 — measurement, QA, and controlled rollout (days 12–21)

- Instrument funnel, payment state, stock failure, shipping event, return reason, support reason, LCP, INP, CLS, API latency, and error rate.
- Add unit/integration/e2e tests for auth, RBAC, catalog publish, cart, checkout, Razorpay webhooks, inventory concurrency, fulfillment, returns, refunds, uploads, and admin actions.
- Run mobile accessibility and usability tests with real target customers.
- Perform backup/restore rehearsal, secret rotation rehearsal, dependency/security scan, load test, and incident runbook review.
- Launch to a small cohort, monitor every order manually, then expand only after one clean fulfillment and returns cycle.

**Final launch gate:** seven consecutive days with no critical errors, successful payment reconciliation, reliable media delivery, complete inventory, tested support/returns operations, and p75 Core Web Vitals in the green on the purchase journey.

## Revised full-system verdict

HRUSHE has enough software to stage a convincing demo, not enough operational truth to run a premium apparel business safely. The codebase contains several good foundations—canonical checkout pricing, inventory reservations, payment signatures, permission middleware, product CRUD, and support records—but the system repeatedly substitutes metadata and polished placeholder screens for real commerce domains.

The next milestone should not be “more admin pages.” It should be one trustworthy loop:

**publish a complete product → show it reliably → reserve real stock → collect and reconcile payment → fulfill and track → support, exchange, or refund → audit every action.**

When that loop works end to end, the visual ambition will finally have an operating system worthy of it.
