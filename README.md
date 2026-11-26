# Peflag — peflag.com

Static B2B storefront for **Shandong Fousi International Trade Co., Ltd.** (brand: Peflag), a Jinan-based
exporter of metabolic, incretin, amylin, lipolytic and mitochondrial **research peptides**.

The site is pure HTML + one stylesheet + one small script. No framework, no build step at deploy time, no
external fonts, no analytics, no CDN dependency. It is designed for GitHub → Cloudflare Pages.

- Canonical host: `https://peflag.com` (never the Cloudflare preview host)
- Language: English (B2B, laboratory buyers)
- Compliance line on every page: *For Laboratory Research Use Only. Not for Human or Veterinary Use.*

---

## 1. What is in the box

```
/
├── index.html                  Home: positioning, portfolio matrix, QC, process, FAQ, inquiry
├── products/
│   ├── index.html              Catalogue with mechanism filter + search (shareable query state)
│   └── <17 product pages>.html One page per molecule, all vial strengths aggregated
├── quality-control.html        HPLC/MS release criteria, COA anatomy, packaging, logistics
├── about.html                  Company, Jinan operations, compliance posture
├── contact.html                WhatsApp / email / phone / address + inquiry form
├── privacy.html                Privacy policy (no cookies, no tracking)
├── 404.html                    Not-found page (noindex)
├── sitemap.xml                 23 URLs, lastmod + priority
├── robots.txt                  All crawlers + GPTBot, ClaudeBot, PerplexityBot, Google-Extended…
├── llms.txt                    GEO index: entity facts, per-product CAS/MW/strength/price, citation guidance
├── site.webmanifest            PWA metadata
├── _headers                    Security headers + cache policy (Cloudflare Pages)
├── _redirects                  www → apex 301, plus short aliases (/retatrutide → product page)
├── favicon.ico
└── assets/
    ├── css/main.css            ~35 KB hand-written design system
    ├── js/main.js              ~11 KB: nav, filter, variant selector, inquiry handoff, copy
    └── img/                    SVG icon, app icons, 23 generated 1200×630 OG cards
```

Total transfer for a product page: **~29 KB gzipped** across 3 requests (HTML + CSS + JS). Product
imagery is inline SVG, so there is no image request on the critical path.

## 2. Product scope

17 compounds, one page each, with every vial strength aggregated on that page (no per-strength URLs, so
no keyword cannibalisation):

| # | Compound | Class | Strengths (mg/vial) |
|---|----------|-------|---------------------|
| 1 | Semaglutide | GLP-1 agonist | 2, 5, 10, 15, 20, 30, 50 |
| 2 | Tirzepatide | GIP/GLP-1 dual | 2, 5, 10, 15, 20, 30, 40, 50, 60, 80, 100, 120 |
| 3 | Retatrutide | GIP/GLP-1/GCG triple | 5, 10, 15, 20, 30, 40, 50, 60, 80, 100 |
| 4 | CagriSema | Amylin + GLP-1 combo | 2.5+2.5, 5+5, 10+10 |
| 5 | Cagrilintide | Amylin agonist | 2, 5, 10 |
| 6 | Survodutide | GLP-1/GCG dual | 10 |
| 7 | Mazdutide | GLP-1/GCG dual | 5, 10 |
| 8 | Dulaglutide | GLP-1 Fc-fusion | 5, 10 |
| 9 | Liraglutide | GLP-1 agonist | 5, 10, 30 |
| 10 | AOD9604 | hGH 176-191 fragment | 1, 2, 5, 10, 12, 15 |
| 11 | Adipotide (FTPP) | Adipose vasculature | 2, 5, 10 |
| 12 | 5-Amino-1MQ | NNMT inhibitor | 5, 10, 50 |
| 13 | MOTS-c | Mitochondrial peptide | 10, 15, 20, 40 |
| 14 | SS-31 | Mitochondria-targeted | 5, 10, 50 |
| 15 | AICAR | AMPK activator | 50, 100 |
| 16 | Humanin | Mitochondrial peptide | 10 |
| 17 | Tesamorelin | GHRH analogue | 2, 5, 10, 20 |

Deliberate consolidations:

- **AOD9604 + HGH Fragment 176-191** are the same 16-residue sequence (CAS 221231-10-3). They were listed
  separately in the source price sheet with different ladders; both now live on `/products/aod9604.html`
  with all six strengths, which removes a duplicate-content conflict.
- **Cagrisema (2.5+2.5 / 5+5 / 10+10)** and the generic "Cagrilintide+Semaglutide" rows were merged into
  one CagriSema page; cagrilintide and semaglutide remain available as separate compounds.

Excluded on purpose: growth-hormone secretagogues, cosmetic/skin peptides, vitamins, bac water and other
non-metabolic items from the same sheet.

## 3. Pricing rule

Source: `多肽产品价格汇总.xlsx` → sheet `总表`, column **中间价 (CNY/盒)** per kit of 10 vials.

```
USD list price per kit = round( CNY_mid / 7.18 × 2 )
```

i.e. converted at the sheet's own FX rate and **doubled**, per the brief. Values are rounded to whole
dollars. The ladder is forced monotonic: if a heavier kit would price below a lighter one, the lighter
SKU is lifted 4 % instead of discounting the heavier one. Three source rows were inverted
(Tirzepatide 80 vs 100 mg, Retatrutide 30 vs 40 mg and 60 vs 80 mg) and are corrected this way.

Prices are per kit, exclude freight, and are re-quoted per production batch for high-strength vials — the
product pages say so explicitly.

## 4. SEO / GEO implementation

- Unique `<title>` (≤ 60 chars, pattern: `Compound Bulk Supplier | ≥99% HPLC | Peflag`) and
  `<meta description>` (≤ 155 chars) on every page, canonical to `https://peflag.com/...`.
- One `<h1>` per page, ordered `h2`/`h3`, semantic landmarks, skip link, visible focus states.
- **Key Specifications & Supplier Summary** block on every product page: name, CAS, formula, MW,
  sequence, purity, form, appearance, target, half-life, storage, strengths, packaging, MOQ,
  documentation, legal entity, address, phone, email — key/value pairs written for direct LLM citation.
- JSON-LD: `Organization` + `WebSite` (home), `Product` + `AggregateOffer` + `FAQPage` +
  `BreadcrumbList` (product pages), `CollectionPage`/`ItemList` (catalogue), `FAQPage` (QC, home),
  `AboutPage` / `ContactPage`.
- 6 buyer-intent FAQs per product (COA verification, MOQ and tiers, packing and transit, payment,
  custom strengths/raw powder, documentation), each answered "conclusion first, detail second".
- Internal linking: related-compound cards on every product page, portfolio matrix on the home page,
  footer compound links, breadcrumbs.
- `llms.txt` at the root with entity facts, per-product CAS/MW/price lines and citation guidance.
- Research-use disclaimer in the footer of every page plus a highlighted strip on product pages.

## 5. Local preview

```powershell
# from this folder
python -m http.server 8899
# → http://127.0.0.1:8899/
```

Opening `index.html` directly from disk works too, except the catalogue filter uses `history.replaceState`
(guarded, so it fails silently).

## 6. Rebuilding the pages

The generator lives **outside** this folder, in `../_peflag_build/`:

```
_peflag_build/
├── data.py         company constants + 17 product records + pricing model
├── notes.py        per-product sourcing notes
├── components.py   head, header, footer, vial SVG, forms, FAQ, CTA
├── pages.py        page templates
├── og.py           Pillow generator for the 1200×630 social cards and icons
├── build.py        writes every HTML file, sitemap, robots, llms.txt, _headers, _redirects
└── qa.py           static QA gate (canonical, titles, JSON-LD, links, sitemap, llms coverage)
```

```powershell
cd ../_peflag_build
python build.py     # regenerate the whole site
python qa.py        # must print "No errors."
```

Edit content in `data.py` / `notes.py` (copy, chemistry, prices) or `pages.py` (layout). Re-run
`build.py`; do not hand-edit the generated HTML.

## 7. Cloudflare Pages deployment

1. **Push to GitHub** — create an empty repo, then from this folder:
   ```powershell
   git init
   git add .
   git commit -m "Peflag static site"
   git branch -M main
   git remote add origin https://github.com/<user>/peflag.git
   git push -u origin main
   ```
2. **Create the Pages project** — Cloudflare dashboard → *Workers & Pages* → *Create* → *Pages* →
   *Connect to Git* → pick the repo.
   - Framework preset: **None**
   - Build command: *(empty)*
   - Build output directory: **`/`**
3. **Deploy**, then verify the temporary Cloudflare preview URL renders correctly. Canonicals already point at
   `peflag.com`, so nothing in the markup needs editing.
4. **Attach the domain** — project → *Custom domains* → *Set up a domain* → `peflag.com`, then repeat for
   `www.peflag.com`. If the domain is registered elsewhere, either move its nameservers to Cloudflare or
   create the CNAME records Cloudflare shows.
5. **TLS** — SSL/TLS → Overview → **Full (strict)**; Edge Certificates → **Always Use HTTPS** on;
   optionally enable HSTS (the `_headers` file already sends an HSTS header).
6. **Redirects** — `_redirects` maps short aliases such as `/retatrutide` to the product page for print and
   trade-show links. Cloudflare accepts **relative URLs only** in that file, so the `www` → apex redirect is
   not set there: add a **Redirect Rule** (Rules → Redirect Rules) for `www.peflag.com/*` →
   `https://peflag.com/$1`, status 301, instead.
7. **Verify** — open `https://peflag.com/`, `/products/`, one product page, `/quality-control.html`,
   `/robots.txt`, `/sitemap.xml`, `/llms.txt`. Confirm the browser shows no mixed content and the
   WhatsApp button opens `https://wa.me/8615866781826`.

## 8. Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console) → *Add property* →
   **Domain** → `peflag.com` (DNS verification). Cloudflare DNS: add the TXT record Google gives you,
   proxy status *DNS only*.
2. After verification, *Sitemaps* → submit `https://peflag.com/sitemap.xml`.
3. *URL Inspection* → request indexing for `/`, `/products/`, `/quality-control.html` and the four
   highest-value compounds (semaglutide, tirzepatide, retatrutide, cagrisema).
4. *Settings → Crawl stats* after a week: confirm `GPTBot`, `ClaudeBot`, `PerplexityBot` and
   `Google-Extended` are fetching (they are explicitly allowed in `robots.txt`).
5. Bing Webmaster Tools → *Import from Google Search Console* (covers Bing + Copilot).
6. Optional: add the site to Cloudflare **Web Analytics** (cookie-free). If you do, load the beacon
   `defer` — it is the only third-party request that would be added.

## 9. Content and compliance rules for whoever edits next

- Never point a canonical, sitemap entry or schema URL at the Cloudflare preview host. Before each release,
  search every HTML file for the preview domain — the result must be empty.
- Every new product page needs: unique copy, the spec panel, 6 FAQs, `Product` + `FAQPage` schema,
  and an entry in `llms.txt` + `sitemap.xml` (both are generated).
- Keep the research-use disclaimer in the footer and the compliance strip on product pages.
- No dosing guidance, no therapeutic claims, no human-use framing, no brand-name drug references.
- Prices: change `cny` values in `data.py`, re-run `build.py`; never edit prices in the HTML.
