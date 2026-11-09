# FireChronicle — Premium Black / Ember / Amber Frontend & Product Master Prompt
**Purpose:** Give Antigravity a complete, implementation-ready brief to upgrade the existing FireChronicle application into a simple, premium, scientifically trustworthy satellite-fire intelligence product.

**Important:** This is a design and engineering specification, not a claim that data, APIs, dependencies, or tests have already been installed or verified. The agent must inspect the actual repository before making changes.

---

## PART A — PRODUCT DIRECTION AND EXPECTED OUTCOME

### 1. Product identity
- **Product:** FireChronicle
- **Descriptor:** Satellite Fire Activity Intelligence
- **Core purpose:** Make MODIS and VIIRS active-fire observations easier to compare across space and time, while showing the uncertainty and provenance behind every harmonized result.

FireChronicle must not feel like a generic admin dashboard, gaming interface, marketing landing page, or decorative AI product. It should feel like a premium scientific analytics application used by environmental analysts, researchers, fire-management teams, and technically curious public users.

The design should be:
- Simple to understand on first use.
- Fast and comfortable to operate during a live demonstration.
- Data-first, map-led, and scientifically transparent.
- Premium through typography, spacing, hierarchy, and restraint—not through excessive glow or animation.
- Responsive, keyboard accessible, and usable on a laptop or mobile device.

### 2. Expected visual outcome
The finished desktop Overview page should have this hierarchy:
1. **Slim left sidebar** (approximately 220–240 px on wide desktop): FireChronicle identity, six clear navigation links, a compact source-mode indicator, and a small help/methodology link.
2. **Compact top bar** (approximately 60–68 px): current page context, current dataset/source badge, selected UTC period, and a restrained user/settings area if those functions exist.
3. **Page introduction:** “Fire activity overview” with one concise explanatory line. Avoid a large promotional hero or oversized decorative image.
4. **Primary filters:** Region/area of interest, date range, sensor. Keep these visible and easy to understand. Put grid size, spatial tolerance, temporal tolerance, confidence handling, and other advanced scientific settings inside a collapsed “Advanced settings” panel.
5. **Four KPI cards:** MODIS detections, VIIRS detections, candidate correspondences, and unique active grid cells. Each card has one prominent value, one short definition or unit, and a small tooltip. Show trend percentages only when there is a valid comparison period and a real calculation.
6. **Main analysis workspace:** interactive map occupying approximately 65–70% of the available row; selected-observation details occupying 30–35%. Keep the map visually dominant but not cluttered.
7. **Lower analysis row:** daily activity/calendar preview and sensor-comparison preview, with links to their full pages.
8. **Historical patterns section:** a readable trend chart and clearly explained anomaly/baseline result, only when enough valid historical data exists.
9. **Footer/source strip:** source, product, retrieval/import time, date coverage, attribution, and “not an official NASA product” statement where appropriate.

At 1440 px desktop width, the page should use its available width without crowding. At 1280 px and below, the KPI and chart grids may wrap. At 768 px, the sidebar should collapse or become a drawer. At 390 px, filters should stack, the map should be full width, and observation details should open in a bottom sheet/drawer. Avoid page-level horizontal scrolling.

### 3. Expected visual qualities
- Crisp, legible Geist Sans or Inter typography.
- Consistent 4/8 px spacing rhythm.
- Quiet charcoal surfaces and thin, low-contrast borders.
- Strong but limited amber/orange primary actions.
- A restrained red accent reserved for high-severity warnings or VIIRS-only category where defined.
- Separate scientific colours for the sensor overlays.
- Clear chart labels, axes, legends, units, and tooltips.
- Subtle hover/focus feedback and short state transitions.
- No decorative emoji, random flames, fake satellite imagery, fake live indicators, fake data, or invented performance numbers.

---

## PART B — BRAND, COLOURS, TYPOGRAPHY, GRAPHICS

### 4. Black / red / yellow / orange premium colour system
Use the palette as a design-token system rather than applying all accents everywhere.

#### Core interface tokens
| Token | Hex | Use |
| :--- | :--- | :--- |
| `--fc-bg` | `#08090B` | Overall application background |
| `--fc-surface` | `#101216` | Primary cards/panels |
| `--fc-surface-raised` | `#171A20` | Raised cards, menus, drawers |
| `--fc-surface-soft` | `#1D222A` | Hover/selected backgrounds |
| `--fc-border` | `#2A3039` | Subtle borders and dividers |
| `--fc-text` | `#F4F5F7` | Main text |
| `--fc-text-secondary` | `#B1B7C1` | Secondary text |
| `--fc-text-muted` | `#858D99` | Muted metadata; never use for essential instructions |
| `--fc-amber` | `#F5B32F` | Main brand accent / focus |
| `--fc-orange` | `#F47A24` | Main action / fire emphasis |
| `--fc-red` | `#E5484D` | Error / critical warning |
| `--fc-red-deep` | `#8F2529` | Subtle deep-red surface, not body text |
| `--fc-yellow` | `#FFD166` | Highlight / high thermal intensity |

#### Scientific data colours — keep distinct from the brand palette
| Meaning | Suggested colour | Rule |
| :--- | :--- | :--- |
| MODIS | `#A78BFA` violet | Keep consistent across map, chart, legend |
| VIIRS | `#38BDF8` cyan | Keep consistent across map, chart, legend |
| Candidate correspondence | `#34D399` green | Must be labelled candidate, not confirmed fire |
| MODIS-only | `#F5B32F` amber | Also use a distinct shape/outline |
| VIIRS-only | `#F87171` coral | Also use a distinct shape/outline |
| FRP / thermal intensity | sequential yellow &rarr; orange &rarr; red | Use only for magnitude, not for sensor identity |

Do not use red for both an error and a data category without also providing a shape and label. Do not use orange to represent every chart series. Never rely on colour alone to encode sensor/category identity.

### 5. Typography
- **Primary:** Geist Sans (`geist` package) or Inter.
- **Technical data:** Geist Mono or another readable monospace, used sparingly for coordinates, timestamps, product identifiers, and record IDs.

| Element | Size | Weight |
| :--- | :--- | :--- |
| Page title | 26–30 px | 600 |
| Section title | 16–18 px | 600 |
| KPI value | 28–32 px | 600–650, tabular numerals |
| Body text | 14 px | 400 |
| Form label | 13 px | 500 |
| Helper text | 12–13 px | 400, adequate contrast |
| Technical metadata | 12–13 px | Geist Mono, regular |

Use sentence case. Do not make every label uppercase, every heading extra-bold, or every numerical value monospaced. Use a consistent line-height (roughly 1.4–1.55 for body content). Do not use Geist Pixel as the main UI font; it is not suitable for dense scientific data.

### 6. Graphics, illustrations, shapes, and image policy
Use graphics to explain the data, not to decorate empty space.
1. **Simple SVG flame/thermal mark:** create a small original, geometric FireChronicle mark using SVG paths or CSS. Avoid a cartoon flame logo.
2. **Satellite/instrument icons:** use consistent line icons from Lucide React for MODIS, VIIRS, calendar, layers, filters, chart, download, info, warning, and source status.
3. **Map markers:** create clear SVG or CSS markers with a distinct fill/outline per sensor. Use cluster circles containing actual child counts. Use a ring/linked marker for candidate correspondence only if it is explicitly labelled.
4. **FRP intensity legend:** a restrained horizontal yellow-orange-red ramp with labels and units.
5. **Grid overlay:** render genuine grid cells derived from the selected grid definition; do not draw random squares or fake heatmap blobs.
6. **Map footprint outlines:** use true product footprint information only when it is actually supplied/derivable; do not make a 1 km circle imply exact pixel geometry if the source gives only a centroid and nominal resolution.
7. **Empty states:** simple line illustration or icon plus a plain-language next action (e.g. “Choose a date range or upload a FIRMS CSV”).
8. **Subtle background geometry:** optional very faint contour/topographic lines, coordinate-grid pattern, or radial glow on the page intro. Keep opacity very low and ensure it does not compete with content.
9. **Charts:** use real time-series data and clear scales; never generate random chart points for the product interface.
10. **Satellite imagery:** use only a legitimate map imagery provider or NASA GIBS imagery layer with attribution and appropriate terms. A stock wildfire photo is not a substitute for a map, fire detection, or dataset.

**Do not add:**
- Random fire photographs in observation cards when there is no source image tied to the observation.
- Glowing fireballs behind every KPI.
- Constantly pulsing markers or backgrounds.
- Large 3D globes that consume space but do not help analysis.
- Random particles, stars, floating embers, or animated flames across the dashboard.
- Fake satellite footprints, fake fire perimeters, or fake map labels.
- Decorative maps built from an unrelated image instead of interactive geospatial layers.

---

## PART C — RECOMMENDED REPOSITORIES, FRAMEWORKS, AND PACKAGES
- **UI UX Pro Max:** design-system guidance, UI patterns, typography, colour, layout, and UX direction.
- **Motion for React:** `motion`, imported from `motion/react`.
- **Lucide React:** consistent line icon system.
- Preserve existing stack: Next.js 14 App Router / React 18 / TypeScript / Tailwind CSS / MapLibre GL / Recharts / DuckDB / FastAPI.

---

## PART D — MOTION, TRANSITIONS, DRAWN SHAPES, AND MICRO-INTERACTIONS
- Subtle state transitions (120–220 ms).
- Strictly adhere to `prefers-reduced-motion`.
- SVG geometric flame mark.
- Clean cluster circles with actual counts.

---

## PART E — DATA SOURCES AND SCIENTIFIC DATA PIPELINE
- Truthful data provenance: `LIVE NASA FIRMS`, `UPLOADED NASA FIRMS CSV`, or `SYNTHETIC DEMONSTRATION DATA`.
- Strict Lambert Cylindrical Equal-Area (CEA) 1.0 km projected grid.
- Candidate correspondence: collocated within 1.0 km nadir radius and &le;60 minutes delta. Never describe as confirmed individual fires.
- FRP non-summation rule: display per-sensor FRP, never sum across collocated sensors.
- Suomi-NPP cessation transparency: redirect to NOAA-20/21 with explicit user notice.

---

## PART F — INFORMATION ARCHITECTURE & PART G — USER JOURNEY
- Overview, Activity calendar, Sensor comparison, Harmonization audit, Historical patterns, Methodology.
- Coherent, tested end-to-end user flows for import, filtering, inspection, comparison, audit, and export.

---

## PART H & I — TESTING AND MASTER IMPLEMENTATION PLAN
- Complete verification of types, linting, scientific unit tests, and browser responsive viewports (1440, 1280, 1024, 768, 390 px).
