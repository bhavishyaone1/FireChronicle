# FireChronicle — Scientific Analytics Design System Specification

**Standard:** UI/UX Pro Max Scientific & Geospatial Guidelines + NASA Space Apps Harmonization Standards  
**Location:** `docs/design-system.md`  
**Application:** FireChronicle Earth Observation Active-Fire Harmonization

---

## 1. Visual Foundation & Color Tokens

FireChronicle adheres to a calm, high-contrast dark scientific palette designed for satellite telemetry and spatial data visualization.

### Surface & Neutral Tokens
| Token | Hex | Role | Applied Context |
|---|---|---|---|
| `--background` | `#090B0F` | Page background | Root background, lowest elevation |
| `--surface` | `#10141B` | Main surface | KPI cards, sidebar, table wrapper, chart frames |
| `--surface-elevated` | `#151A22` | Elevated surface | Popovers, active dropdowns, floating control overlays |
| `--border` | `#28313D` | Structural border | Card outlines, dividers, table borders |
| `--text-primary` | `#F1F5F9` | Primary text | Headers, KPI numerals, active labels (contrast &ge; 12:1) |
| `--text-secondary` | `#A4AFBF` | Secondary text | Metadata, subtitles, axis ticks, inactive labels |
| `--brand-amber` | `#F59E0B` | System accent | Action buttons, primary focus outlines, system highlights |

### Sensor & Harmonization Color Taxonomy
Color carries rigorous physical and categorical meaning. No arbitrary colors are used.

| Category | Hex | Meaning | Applied Context |
|---|---|---|---|
| **MODIS Sensor** | `#A78BFA` | MODIS 1.0 km nadir detection | Marker fill, chart area, KPI icon, table badge |
| **VIIRS Sensor** | `#38BDF8` | VIIRS 375 m nadir detection | Marker fill, chart area, KPI icon, table badge |
| **Candidate Matches** | `#34D399` | Spatio-temporally matched pair | Map halo ring, match sparkline, concordance metric |
| **MODIS-Unique** | `#F59E0B` | Observation with no VIIRS match | Discontinuity inspector, audit ledger flag |
| **VIIRS-Unique** | `#F87171` | Observation with no MODIS match | Discontinuity inspector, audit ledger flag |

### Fire Intensity Scale
Sequential yellow-to-red ramp with explicit units (MW) and legend:
- Low (nominal): `#FDE047`
- Moderate: `#F59E0B`
- Intense: `#EA580C`
- Extreme: `#DC2626`

---

## 2. Typography & Numerical Hierarchy

- **Primary Interface Font:** Geist Sans (with Inter and system-ui fallbacks).
- **Monospace Technical Font:** Geist Mono (reserved for coordinates, UTC ISO timestamps, SHA-256 IDs, and tabular numbers).
- **Type Scale:**
  - Page Title: 26–30px, semibold (600), tracking-tight
  - Section Headings: 16–18px, semibold (600)
  - KPI Numerals: 28–32px, semibold (600/650), `font-mono tabular-nums`
  - Body Text: 14–16px, regular (400), leading-relaxed
  - Form & Filter Labels: 13–14px, medium (500)
  - Captions & Secondary Metadata: 12–13px, regular (400)
- **Casing:** Sentence case for all interface labels, buttons, and column headings.

---

## 3. Motion & Interaction Architecture

Implemented using `motion/react` (Motion for React):
- **Page & Section Entrances:** Subtle opacity (0 &rarr; 1) with small vertical displacement (y: 6px &rarr; 0), 180–220ms.
- **KPI Cards:** Restrained stagger (`staggerChildren: 0.05`) on first mount.
- **Observation Inspector:** `AnimatePresence` with smooth fade/cross-slide when active observation changes.
- **Tabs & Drawers:** Smooth opacity transition without layout shift or bouncy spring physics.
- **Accessibility:** Strict adherence to `prefers-reduced-motion`. All animations bypass transforms when reduced motion is requested.

---

## 4. Spacing, Borders & Layout Grid

- **Base Scale:** 4px / 8px grid (p-2: 8px, p-3: 12px, p-4: 16px, p-6: 24px).
- **Border Radius:** 8px (`rounded-lg`) for cards, 6px (`rounded-md`) for controls and badges.
- **Desktop Grid:** 12-column grid or 8/4 split between spatial map canvas and analytical inspector.
- **Mobile Stack:** Collapsed navigation pill bar, full-width touch cards, and zero horizontal document overflow.
