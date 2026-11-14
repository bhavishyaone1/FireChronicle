# FireChronicle — Documentation Index

Welcome to the **FireChronicle** technical and scientific documentation register. This index provides a single point of reference for all methodology, architectural specifications, data dictionaries, validation reports, and governance cards.

---

## 🔬 Scientific Methodology & Algorithms

| Document | Focus Area | Description |
| :--- | :--- | :--- |
| [**`methodology.md`**](methodology.md) | Harmonization Pipeline | The end-to-end 11-stage pipeline for harmonizing MODIS and VIIRS active-fire hotspot observations into consistent burning activity indicators. |
| [**`HARMONIZATION_METHOD.md`**](HARMONIZATION_METHOD.md) | Mathematical Specification | Detailed formulas for Lambert Cylindrical Equal-Area (CEA) projection, bipartite matching algorithms (Greedy vs. Global), and cell aggregation. |
| [**`LIMITATIONS.md`**](LIMITATIONS.md) | Physical Sensor Constraints | Clear, honest scientific constraints: spatial footprint variations, cloud obscuration, saturation, orbital pass geometry, and confidence metrics. |
| [**`model_card.md`**](model_card.md) | ML & Statistical Governance | Model specifications, contextual heuristic bounds, feature definitions, and anti-hallucination guardrails. |
| [**`validation_report.md`**](validation_report.md) | Validation & Sensitivity | Empirical validation across biomes, bootstrap uncertainty intervals (95% CI), and distance/time sensitivity curves. |

---

## 🛰️ Data Sources & Schemas

| Document | Focus Area | Description |
| :--- | :--- | :--- |
| [**`data_sources.md`**](data_sources.md) | NASA FIRMS Products | Technical parameters for MODIS Collection 6.1 (Terra/Aqua) and VIIRS Collection 2 (Suomi-NPP, NOAA-20, NOAA-21). |
| [**`DATA_DICTIONARY.md`**](DATA_DICTIONARY.md) | Field Reference | Canonical normalized observation fields, types, valid ranges, units, and cross-sensor mapping definitions. |
| [**`INDIA_DATA_SOURCE_REGISTER.md`**](INDIA_DATA_SOURCE_REGISTER.md) | Regional Context | Integration specs for Forest Survey of India (FSI Van Agni) forest fire bulletins and ISRO Bhuvan agricultural burning data. |

---

## 🏗️ Architecture & Engineering

| Document | Focus Area | Description |
| :--- | :--- | :--- |
| [**`architecture.md`**](architecture.md) | Full-Stack Architecture | FastAPI backend, DuckDB embedded analytics, Next.js 14 client, and REST API contract. |
| [**`frontend_architecture.md`**](frontend_architecture.md) | Client Architecture | UI component hierarchy, dynamic MapLibre GL rendering, and responsive state synchronization. |
| [**`design-system.md`**](design-system.md) | Design Tokens & WCAG | Premium black/ember/amber color palette, colorblind-safe sensor tokens, typography, and accessibility guidelines. |
| [**`environment.md`**](environment.md) | Environment & Toolchain | Operating system requirements, Python virtual environment, Node.js tooling, and reproducible local setup. |
| [**`test_plan.md`**](test_plan.md) | Quality Assurance | Pytest backend test suite, synthetic hand-built test scenes, and frontend build verification. |
| [**`official_challenge_requirements.md`**](official_challenge_requirements.md) | Challenge Alignment | Direct mapping of NASA Space Apps 2026 challenge objectives to FireChronicle implementation features. |
