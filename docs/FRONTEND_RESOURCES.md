# FireChronicle Frontend Resources Register

**Document:** Frontend Technical Index & Official Reference Register  
**Audit & Access Date:** 2026-10-25  
**System:** FireChronicle Web Client  
**Design Concept:** “Earth Observation Mission Control”

---

## 1. Framework, Language & Styling

| Resource / Library | Canonical URL | Purpose | Usage in FireChronicle |
| :--- | :--- | :--- | :--- |
| **Next.js App Router** | [https://nextjs.org/docs/app](https://nextjs.org/docs/app) | Core React full-stack framework with React Server Components (RSC) | Layout shells, static pages, and route management |
| **Next.js Getting Started** | [https://nextjs.org/docs/app/getting-started](https://nextjs.org/docs/app/getting-started) | Framework setup and project configuration | Runtime and dependency compatibility validation |
| **Next.js Fonts (`next/font`)** | [https://nextjs.org/docs/app/getting-started/fonts](https://nextjs.org/docs/app/getting-started/fonts) | Zero-layout-shift font optimization | Typography loading (Geist / Inter) |
| **Tailwind CSS + Next.js Guide**| [https://tailwindcss.com/docs/installation/framework-guides/nextjs](https://tailwindcss.com/docs/installation/framework-guides/nextjs) | Utility-first styling framework | Semantic color tokens and mission-control dark theme |
| **shadcn/ui Next.js Setup** | [https://ui.shadcn.com/docs/installation/next](https://ui.shadcn.com/docs/installation/next) | Accessible component primitives guide | Accessible UI architecture patterns |
| **shadcn/ui Components** | [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components) | Primitive UI components catalog | Card, badge, tabs, tooltip, and popover specifications |
| **React Documentation** | [https://react.dev/learn](https://react.dev/learn) | Official React library documentation | Component lifecycle, client state, and dynamic rendering |
| **TypeScript Handbook** | [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/) | Type-safe static analysis | Shared typed schemas between FastAPI and React |

---

## 2. Motion, Icons, State & Data Fetching

| Resource / Library | Canonical URL | Purpose | Usage in FireChronicle |
| :--- | :--- | :--- | :--- |
| **Motion for React** | [https://motion.dev/docs/react](https://motion.dev/docs/react) | Purposeful micro-interactions (formerly Framer Motion) | Subtle panel transitions and state animations |
| **Motion Accessibility** | [https://motion.dev/docs/react-accessibility](https://motion.dev/docs/react-accessibility) | `prefers-reduced-motion` compliance | Disabling non-essential motion for sensitive users |
| **Lucide React** | [https://lucide.dev/guide/packages/lucide-react](https://lucide.dev/guide/packages/lucide-react) | Tree-shakeable SVG icons | Accessible scientific icons across all views |
| **TanStack Query** | [https://tanstack.com/query/latest/docs/framework/react/overview](https://tanstack.com/query/latest/docs/framework/react/overview) | Asynchronous state & server cache manager | Client-side query caching and retry coordination |
| **Zod** | [https://zod.dev/](https://zod.dev/) | TypeScript-first schema declaration and validation | Runtime API payload contract validation |
| **date-fns** | [https://date-fns.org/docs/Getting-Started](https://date-fns.org/docs/Getting-Started) | Modular date utility library | UTC calendar sequence generation and date window math |
| **next-themes** | [https://github.com/pacocoursey/next-themes](https://github.com/pacocoursey/next-themes) | Hydration-safe theme switching | Dark mission-control theme management |
| **Zustand** | [https://zustand.docs.pmnd.rs/getting-started/introduction](https://zustand.docs.pmnd.rs/getting-started/introduction) | Lightweight client state store | Evaluated; React standard state used for MVP simplicity |

---

## 3. Maps and Geospatial Visualization

| Resource / Library | Canonical URL | Purpose | Usage in FireChronicle |
| :--- | :--- | :--- | :--- |
| **MapLibre GL JS** | [https://maplibre.org/maplibre-gl-js/docs/](https://maplibre.org/maplibre-gl-js/docs/) | Open-source WebGL vector & raster mapping | GPU-accelerated hotspot footprint canvas in `HotspotMap.tsx` |
| **MapLibre Style Spec** | [https://maplibre.org/maplibre-style-spec/](https://maplibre.org/maplibre-style-spec/) | JSON-based map styling specification | Circle layers, halo strokes, and raster tile configuration |
| **OpenFreeMap Overview** | [https://openfreemap.org/](https://openfreemap.org/) | Free, open-source vector map hosting | Dark basemap style reference (`https://tiles.openfreemap.org/styles/dark`) |
| **NASA GIBS Access Basics** | [https://nasa-gibs.github.io/gibs-api-docs/access-basics/](https://nasa-gibs.github.io/gibs-api-docs/access-basics/) | Global imagery WMTS/WMS documentation | Specification for True Color satellite imagery layers |
| **NASA GIBS Product Catalog**| [https://nasa-gibs.github.io/gibs-api-docs/](https://nasa-gibs.github.io/gibs-api-docs/) | Complete NASA satellite imagery layers list | Identification of Terra/Aqua MODIS and VIIRS Corrected Reflectance layers |
| **OpenStreetMap Tile Policy** | [https://operations.osmfoundation.org/policies/tiles/](https://operations.osmfoundation.org/policies/tiles/) | Usage restrictions on public OSM tile servers | Strict attribution and caching rules compliance |
| **Leaflet / React Leaflet** | [https://leafletjs.com/reference.html](https://leafletjs.com/reference.html) | Lightweight 2D canvas alternative | Evaluated as fallback; MapLibre GL JS selected for WebGL performance |

---

## 4. Charts, Testing, Accessibility & Deployment

| Resource / Library | Canonical URL | Purpose | Usage in FireChronicle |
| :--- | :--- | :--- | :--- |
| **Recharts** | [https://recharts.github.io/en-US/guide/installation/](https://recharts.github.io/en-US/guide/installation/) | Declarative React charting components | Burning-Activity timeline and FRP distribution charts |
| **Playwright** | [https://playwright.dev/docs/intro](https://playwright.dev/docs/intro) | End-to-end browser automation framework | UI end-to-end workflow verification |
| **React Testing Library** | [https://testing-library.com/docs/react-testing-library/intro/](https://testing-library.com/docs/react-testing-library/intro/) | Component integration testing | Component interaction testing |
| **axe-core for Playwright** | [https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) | Automated accessibility testing engine | WCAG 2.2 contrast and ARIA audit |
| **W3C WCAG 2.2** | [https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/) | Web Content Accessibility Guidelines | Minimum 4.5:1 text contrast and non-color-only encoding |
| **Vercel Deployment** | [https://vercel.com/docs/frameworks/nextjs](https://vercel.com/docs/frameworks/nextjs) | Next.js zero-config deployment | Optional frontend cloud hosting documentation |
