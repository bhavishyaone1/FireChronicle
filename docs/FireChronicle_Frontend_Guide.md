# FireChronicle — Frontend Design System, UX Specification and Antigravity Build Guide

**Purpose:** A practical frontend reference for FireChronicle, a scientific geospatial dashboard for comparing NASA MODIS and VIIRS active-fire observations and exploring harmonized historical fire activity.

**Important event-rule note:** Use this document to research, plan, review UI/UX, and prepare the development environment before the official hackathon. Follow the current NASA Space Apps Challenge rules and local-event instructions on when actual challenge-solution development may begin. Do not misrepresent mock data as real observations.

---

## 1. Product Principle
FireChronicle is not a generic admin dashboard, a fire-prediction product, or merely a map with red dots. It is a transparent scientific analysis tool. The interface should help a user answer:
1. What active-fire observations exist for this selected region and period?
2. How do MODIS and VIIRS observations compare?
3. Which observations are matched by the stated method, and which are unique to a sensor?
4. How does observed activity vary across days, months, seasons, and years?
5. What did the harmonization process change, what did it preserve, and what uncertainty remains?
6. Where did the data come from, when was it retrieved, and what are the limitations?

The UI must distinguish hotspot detections, unique active grid cells, FRP, burned area, individual fire events, and future risk. These are not interchangeable concepts.

---

## 2. Official Documentation and Source Register
Start with official sources, then use third-party design examples only for inspiration.

### Framework and styling
- Next.js App Router: https://nextjs.org/docs/app
- Next.js getting started: https://nextjs.org/docs/app/getting-started
- Next.js fonts / next/font: https://nextjs.org/docs/app/getting-started/fonts
- Tailwind CSS + Next.js guide: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- shadcn/ui Next.js installation: https://ui.shadcn.com/docs/installation/next
- shadcn/ui component library: https://ui.shadcn.com/docs/components
- React documentation: https://react.dev/learn
- TypeScript handbook: https://www.typescriptlang.org/docs/

### Motion, icons, state and data fetching
- Motion for React (current package; formerly Framer Motion): https://motion.dev/docs/react
- Motion accessibility / reduced motion: https://motion.dev/docs/react-accessibility
- Lucide React: https://lucide.dev/guide/packages/lucide-react
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview
- Zod: https://zod.dev/
- date-fns: https://date-fns.org/docs/Getting-Started
- next-themes: https://github.com/pacocoursey/next-themes
- Zustand (optional; use only if state becomes complex): https://zustand.docs.pmnd.rs/getting-started/introduction

### Maps and geospatial display
- MapLibre GL JS documentation: https://maplibre.org/maplibre-gl-js/docs/
- MapLibre Style Specification: https://maplibre.org/maplibre-style-spec/
- OpenFreeMap overview: https://openfreemap.org/
- OpenFreeMap quick start and styles: https://openfreemap.org/quick_start/
- NASA GIBS access basics: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
- NASA GIBS visualization product catalog: https://nasa-gibs.github.io/gibs-api-docs/
- OpenStreetMap standard tile policy: https://operations.osmfoundation.org/policies/tiles/
- Leaflet: https://leafletjs.com/reference.html
- React Leaflet: https://react-leaflet.js.org/

### Charts, tests, accessibility and deployment
- Recharts: https://recharts.github.io/en-US/guide/installation/
- Playwright: https://playwright.dev/docs/intro
- Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- axe-core for Playwright: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Web.dev accessibility: https://web.dev/learn/accessibility/
- Vercel deployment docs: https://vercel.com/docs/frameworks/nextjs
- Next.js deployment docs: https://nextjs.org/docs/app/getting-started/deploying

### Fire data and scientific context
- NASA Space Apps 2026: https://www.spaceappschallenge.org/2026/
- Official challenge: https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/
- FIRMS data download: https://firms.modaps.eosdis.nasa.gov/download/
- FIRMS API docs: https://firms.modaps.eosdis.nasa.gov/api/
- MODIS active-fire product docs: https://modarch.gsfc.nasa.gov/data/dataprod/mod14.php
- VIIRS fire product docs: https://viirsland.gsfc.nasa.gov/Products/NASA/FireESDR.html
- NASA Worldview: https://worldview.earthdata.nasa.gov/
- NASA GIBS: https://www.earthdata.nasa.gov/data/tools/gibs

Keep a source register in `docs/FRONTEND_RESOURCES.md`.

---

## 3. Recommended Design Direction
**Design concept:** “Earth Observation Mission Control”  
A premium, restrained scientific interface: deep navy surfaces, high legibility, one cool interactive accent, and a carefully controlled thermal color scale for fire activity.

### Color Tokens
- `--background`: `#0A0F1A`
- `--surface`: `#101827`
- `--surface-elevated`: `#162236`
- `--surface-muted`: `#1B2A40`
- `--border`: `#26364B`
- `--text-primary`: `#F3F6FB`
- `--text-secondary`: `#A8B6C8`
- `--text-muted`: `#8493A8`
- `--action`: `#2563EB`
- `--accent-cyan`: `#40C4D8`
- `--accent-violet`: `#A78BFA` (MODIS)
- `--viirs-cyan`: `#38BDF8` (VIIRS)
- `--matched`: `#F8FAFC`
- `--fire-low`: `#FDE68A`
- `--fire-mid`: `#FB923C`
- `--fire-high`: `#EF4444`

### Sensor Encoding Rules
- MODIS identity: violet marker edge / symbol / legend label (`#A78BFA`).
- VIIRS identity: cyan marker edge / symbol / legend label (`#38BDF8`).
- Matched candidate: distinct outlined/dual-ring marker (`#F8FAFC`).
- FRP magnitude: separate sequential heat scale (`#FDE68A` → `#FB923C` → `#EF4444`).
- Do not encode sensor source and fire intensity with the same visual variable in the same view.
