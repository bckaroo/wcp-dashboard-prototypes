# Westchester Communities & Places Dashboard — two working alternatives

Static prototypes of the two dashboard alternatives drawn in FigCraft, published on GitHub Pages.
Both are branded to Westchester County Department of Planning and carry real County, Census and HUD
data. Every screen is composed only from widgets ArcGIS Experience Builder provides, so either
alternative can be rebuilt in Experience Builder without a redesign.

| Alternative | URL | Design source |
|---|---|---|
| Landing page (both) | `/` | `design/exports/00-brand-inventory.png` |
| **A — theme storytelling** | `/alt-a/` | `design/exports/alt-A-theme-storytelling.pdf` (A1–A4) |
| **B — map explorer** | `/alt-b/` | `design/exports/alt-B-map-explorer.pdf` (B1–B4) |

Product name on every header, verbatim: **Westchester Communities & Places Dashboard**.

---

## 1. Repository layout

```
/                      landing page: both alternatives, data-sources table, licence notes
/alt-a/                Alternative A — single page app, hash routes
/alt-b/                Alternative B — single page app, hash routes
/assets/css/           wcp.css (palette/type/layout), fonts.css (self-hosted @font-face)
/assets/fonts/         Archivo + Public Sans woff2, SIL Open Font License
/assets/js/wcp.js      shared shell: header, footer, CSV/GeoJSON loaders, chart primitives,
                       MapLibre map factory, number/percent formatting, source strings
/assets/js/alt-a.js    Alternative A screens and interactions
/assets/js/alt-b.js    Alternative B screens and interactions
/assets/vendor/        MapLibre GL JS 4.x + CSS (BSD-3-Clause), Noto Sans glyph PBFs (OFL)
/assets/img/           County logo, county locator SVG, landing previews
/data/layers/          20 GeoJSON layers, EPSG:4326, MapLibre-renderable geometry only
/data/tables/          12 indicator CSVs (see data/README.md)
/data/README.md        per-layer source, vintage, source CRS, feature count, field dictionary
```

Routes are hash-based so a single HTML file per alternative serves every screen and works on
GitHub Pages without rewrite rules:

* Alternative A: `#home`, `#theme/<population|housing|mobility|economics|services>`, `#map`, `#about`
* Alternative B: `#map`, `#map/layers`, `#municipality/<name>`, `#municipalities`, `#tracts`,
  `#themes`, `#about`

## 2. Screen set, as built

| Design frame | Built route | What the screen does |
|---|---|---|
| A1 Landing · County overview | `/alt-a/#home` | 5 county indicator cards, 5 theme cards, municipality locator, release notes, methodology panel |
| A2 Theme detail · Housing | `/alt-a/#theme/housing` | 5 indicators for the theme, bar chart with county reference line, tenure donut, municipality table, source line |
| A3 Map view · themed filters | `/alt-a/#map` | filter row (theme, indicator, geography), choropleth, pop-up, legend, selected-geography card, comparison bars, results table |
| A4 About · data sources | `/alt-a/#about` | provenance table (6 rows), how the data is organised, limitations, accessibility, version, contact |
| B1 Landing · map explorer | `/alt-b/#map` | sidebar filters, layer list, full-bleed map, 4 live tiles, legend, place search |
| B2 Municipality profile | `/alt-b/#municipality/Yonkers` | 5 indicators against the county, comparison bars with county ticks, tenure donut, indicator table, CSV export |
| B3 Map explorer · layers + tract | `/alt-b/#map/layers` | expanded layer panel, census-tract selection card, results table |
| B4 About panel over map | `/alt-b/#about` | provenance, limitations, accessibility, version as a side panel without leaving the map |

Additional list screens exist to satisfy the ExB *List* widget and the geography vocabulary
(45 municipalities, 241 census tracts): `/alt-b/#municipalities`, `/alt-b/#tracts`,
`/alt-b/#themes`.

## 3. Experience Builder widget mapping

Every UI element is a stock Experience Builder widget. No custom code widget, no 3D, no animation,
no free-floating drag, no client-side editing.

| UI element | Experience Builder widget | Where it is implemented |
|---|---|---|
| Green header bar, logo, product name, agency line, Share | **Header** | `wcp.js › WCP.header()` |
| Theme tabs (A) / sidebar navigation (B), active-page state | **Tab**, **Navigation** | `WCP.header()` + `renderShell()` in each app |
| KPI cards with value, unit, source string | **Indicator** | `WCP.kpi()`; fed by `data/tables/kpi_*.csv` |
| Horizontal comparison bars, county reference line | **Chart — bar** | `WCP.hBars()` |
| Tenure / low-moderate-income donut | **Chart — pie** | `WCP.donut()` |
| Choropleth, pop-ups, legend, layer list | **Map** (web map + pop-ups + layer list) | `WCP.MapView()` (MapLibre GL JS, the engine behind ExB's web map), layer toggles in `alt-b.js › toggleLayer()` |
| Filter row (A3) / sidebar filters (B1) | **Filter**, **Category Selector** | `alt-a.js › wireTheme()`, `alt-b.js › wireExplorer()` |
| Municipality and indicator tables, tract list, CSV export | **List**, **Feature Info** | `alt-a.js › fillMapTable()`, `alt-b.js › pageMunicipalities()` / `pageTracts()` |
| About and data-sources panels | **Rich text** | `alt-a.js › pageAbout()`, `alt-b.js › pageAboutPanel()` |
| Tract detail card (B3) | **Indicator** | `alt-b.js › renderTractCard()` |
| Municipality search / locator | **Search** widget | `#home-search` (A), `#b-search` (B) |

Deliberate exclusions, because Experience Builder cannot express them: 3D scenes, fly-through or
any scripted camera animation, canvas drawing or custom WebGL layers, client-side editing or
feature creation, and free-dragging panels. Where the FigCraft frames showed a floating spec panel,
it was treated as an annotation and left out of the build.

## 4. Data

Real data only. No lorem ipsum and no illustrative figures: every number on screen is read at
runtime from `data/` — ACS 2020–2024 5-year estimates (Census API), TIGER/Line 2024 boundaries,
County GIS REST services, HUD LMISD 2016–2020, and NYS DOS Disadvantaged Communities 2023.

Loaded by the two alternatives:

* **8 of the 20 layers** — `municipalities`, `county_boundary`, `census_tracts`, `open_space`,
  `zoning_districts`, `public_schools`, `roads_major`, `beeline_stops`.
* **8 of the 12 tables** — `kpi_dictionary`, `kpi_county`, `kpi_towns_cities`, `kpi_tracts`,
  `lmisd_block_groups`, `open_space_by_municipality`, `zoning_by_municipality`, plus the ACS full
  tables for the CSV exports.

The remaining layers and tables ship in `data/` because they are part of the data deliverable and
are referenced in `data/README.md`; they are not drawn by these two prototypes.

**Where a figure does not exist, the screen says `pending county AGOL`.** That applies to
village-level ACS profiles (villages are not county subdivisions, so ACS publishes none), NYSED
school enrolment, and CDBG funded-project polygons (not yet released by the County).

## 5. Licensing

| Asset / source | Terms |
|---|---|
| U.S. Census Bureau ACS + TIGER/Line | Public domain (U.S. Government work) |
| HUD LMISD | Public domain (U.S. Government work) |
| NYS Department of State Disadvantaged Communities | Free public use with citation (cited on A4/B4 and in `data/README.md`) |
| **Westchester County GIS REST services** | **Public services, but the County publishes no explicit licence statement.** Confirm terms with WCGIS before this build is promoted beyond internal review. |
| MapLibre GL JS | BSD-3-Clause (vendored, `assets/vendor/`) |
| Archivo, Public Sans, Noto Sans glyphs | SIL Open Font License 1.1 (self-hosted, no CDN) |
| County Planning logo | County asset, used unaltered; not redistributed for reuse |

No third-party analytics, no trackers, no external network calls at runtime: the map, fonts,
glyphs and library are all served from this repository, so the pages work without CDN access.

## 6. Build and deploy

Source of truth for the site is `site/` in the project workspace
(`/mnt/e/OC_Projects/projects/internal/wcp-dashboard`). Data is copied from `data/` by
`site_build/prepare_site.py`; nothing is hand-edited inside `data/`.

```
python site_build/prepare_site.py                  # copy layers, tables, logo, locator SVG
python -m http.server 8177 --directory site        # preview
python site_build/verify_site.py http://127.0.0.1:8177
bash  site_build/deploy_pages.sh                   # stage, commit, push, wait for Pages
python site_build/verify_site.py https://bckaroo.github.io/wcp-dashboard-prototypes
```

## 7. Verification

`site_build/verify_site.py` drives real Chromium (Playwright) and asserts, per screen: no console
errors, no page errors, no failed requests, widgets present, real values present, filters change
the visuals, and no horizontal overflow at 1280 and 1920 px. Screenshots land in
`site_build/shots/`.

Local run (`http://127.0.0.1:8177`): **50 checks, 0 failed, 0 console errors, 0 failed requests** —
including `A3 indicator filter changes map legend`, `A3 selected card carries real values`,
`A3 filter bar fits one line`, `B1 search changes tiles`, `B1 legend clear of tiles`,
`B1 zoning layer loads`, `B2 comparison bars are visible`, `B2 gross rent resolves from the KPI table`,
`B3 tract card renders`, `A2 template — demographics/housing/mobility/economics/services`,
`width 1280 / 1920 no horizontal overflow`, and `root index links both alternatives`.

Live run against the GitHub Pages URL: see §8 below.

## 8. Live verification record

Filled in from the run against the published URL — see the closing section of this file.

## 9. Known gaps and decisions

1. **Alternative A and B share a shell.** Header, footer, card system, palette and type are
   identical by design, so either can launch first and the other can be added as a tab.
2. **Fonts are a documented substitution.** The County's licensed families (Degular, Sofia Pro)
   were not obtainable; Archivo + Public Sans are used and self-hosted. Swapping them is a change
   to `assets/css/fonts.css` and two `font-family` declarations in `wcp.css`.
3. **Municipality-level ACS values are estimates, not signed-off KPIs.** Each card names its ACS
   table; the 49 candidate KPIs in the requirements brief still need a County reviewer.
4. **Villages without an ACS profile** appear on the map and in lists with an explicit
   "no ACS profile" class, rather than being hidden.
5. **Margins of error** are available on hover and in the ACS full-table CSVs, not as a table column.
6. **County GIS licence** is unresolved — see §5. This is the one open item that blocks a public
   launch beyond internal review.
7. **Roads layer** ships functional class 1–3 only (9,395 of 103,816 segments) to keep the page load
   reasonable; local and collector roads are absent by decision, noted in `data/README.md`.
8. **`README.md` and `data/README.md` links** from the site point at GitHub, because GitHub Pages
   serves Markdown as plain text.

---

Built by the `builder` agent (Hermes) from the FigCraft definitions in `design/` and the data
package in `data/`. Model: deepseek-v4.1-flash (ollama-cloud).
