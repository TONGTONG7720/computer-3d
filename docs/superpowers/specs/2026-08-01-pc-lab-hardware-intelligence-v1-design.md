# PC LAB 3D Hardware Intelligence V1.0 Design

**Status:** Approved for implementation by the user's 2026-08-01 phase brief.

**Scope:** Hardware catalogue, specification intelligence, compatibility analysis, performance
scoring, budget control, deterministic optimization, Builder API integration, Hardware Explorer,
and an operational Hardware CMS. Marketplace synchronization, community, account features, and AI
chat are outside this phase.

## 1. Product outcome

The Builder stops treating hardware as local presentation fixtures. MySQL becomes the durable source
of hardware identity, category specifications, performance profiles, compatibility rules, internal
reference prices, and 3D model descriptors. Spring Boot owns authoritative analysis. The frontend
keeps a fast local projection for immediate feedback, then reconciles with the latest versioned
server result.

The completed user loop is:

```text
Browse/search/filter hardware
  -> select a real API record
  -> Builder Store revision increments
  -> Three.js resolves the hardware model descriptor
  -> server analyses compatibility/performance/budget
  -> stale responses are discarded
  -> user can inspect and apply deterministic optimization
```

## 2. Architecture

```text
Next.js 16
  /hardware              Hardware Explorer
  /builder               Catalogue + analysis + optimizer
  /admin/hardware        Catalogue / model / rule operations
       |
       | JSON over /api
       v
Spring Boot 3 / Java 21
  Hardware Query Service
  Hardware Intelligence Service
    Compatibility Engine
    Performance Engine
    Budget Engine
    Build Optimizer
  Admin Hardware / Model / Rule Services
       |
       +--> Redis: list/detail/analysis caches
       |
       v
MySQL 8
  hardware -> category specification
           -> hardware_performance_data
           -> product_price
           -> hardware_model
  compatibility_rule
```

The existing `hardware`, category specification, `product_price`, and `hardware_model` tables remain
authoritative. V1 does not create a parallel product catalogue.

## 3. Data model

### 3.1 Existing tables retained

- `hardware`: identity, brand, category, display model, internal price, baseline score, power,
  image/model fallback URL, publication state, popularity.
- `cpu_spec`, `gpu_spec`, `motherboard_spec`, `memory_spec`, `storage_spec`, `cooling_spec`,
  `psu_spec`, `case_spec`: one-to-one category intelligence.
- `product_price`: internal reference price and future price-ecosystem seam.
- `hardware_model`: one-to-many LOD-ready GLB descriptors.

### 3.2 V6 extensions

| Table | Change | Purpose |
|---|---|---|
| `hardware` | `popularity_score INT UNSIGNED DEFAULT 0` | Stable popularity sorting |
| `cpu_spec` | `generation VARCHAR(48)` | Explorer and recommendation context |
| `gpu_spec` | `interface_type VARCHAR(32)`, `resolution_support JSON` | Slot/display capability |
| `motherboard_spec` | `chipset VARCHAR(48)` | Search and explanation |
| `psu_spec` | `connectors JSON` | Power connector intelligence |
| `hardware_model` | `animation_config JSON` | Per-model installation overrides |

### 3.3 `hardware_performance_data`

One reviewed profile per hardware record:

| Field | Type | Constraint |
|---|---|---|
| `hardware_id` | BIGINT UNSIGNED | PK/FK hardware |
| `gaming_score` | TINYINT UNSIGNED | 0-100 |
| `creator_score` | TINYINT UNSIGNED | 0-100 |
| `ai_score` | TINYINT UNSIGNED | 0-100 |
| `source` | VARCHAR(80) | reviewed benchmark source label |
| `profile_version` | INT UNSIGNED | optimistic version |
| `measured_at` | DATETIME(3) | provenance timestamp |

### 3.4 `compatibility_rule`

Rules are data-controlled but evaluated by typed code:

| Field | Type | Purpose |
|---|---|---|
| `code` | VARCHAR(64), unique | Stable API/rule identifier |
| `source_category` | VARCHAR(32) | First component category |
| `target_category` | VARCHAR(32) | Second component category |
| `rule_type` | VARCHAR(40) | Exhaustive engine dispatch key |
| `severity` | VARCHAR(16) | ERROR or WARNING |
| `message_template` | VARCHAR(300) | Operator-managed explanation |
| `config_json` | JSON | Headroom/reserve parameters only |
| `priority` | INT | Deterministic result order |
| `enabled` | TINYINT(1) | Runtime switch |
| `version` | INT UNSIGNED | Optimistic admin mutation |

V1 rule types are `SOCKET_MATCH`, `MEMORY_GENERATION`, `GPU_CLEARANCE`, `CPU_COOLING_TDP`,
`COOLER_SOCKET`, `MOTHERBOARD_FORM_FACTOR`, `RADIATOR_CLEARANCE`, and `PSU_HEADROOM`.

## 4. Hardware query contract

`GET /api/hardware` accepts:

- `keyword`, `category`, repeated `brand`
- `minPrice`, `maxPrice`, `minPerformance`, `maxPower`
- `sort=relevance|price_asc|price_desc|performance_desc|popularity_desc|newest`
- `page`, `size`

Every list/detail item returns identity, internal price, baseline score, category-specific
specification, three performance profile scores, popularity, and the primary model descriptor.
All incoming query/request data is validated at the HTTP boundary.

## 5. Compatibility Engine

The engine accepts a partial or complete category-to-hardware selection. Missing categories are
reported as `INCOMPLETE`, not incompatible. Present pairs are evaluated in rule priority order:

1. CPU socket equals motherboard socket.
2. RAM generation equals motherboard RAM type.
3. GPU length does not exceed case clearance.
4. Cooler capacity covers CPU TDP and supports the CPU socket.
5. Motherboard form factor and radiator size fit the case.
6. Required PSU wattage equals `ceil((component draw + 75W reserve) * 1.20 / 50) * 50`.
7. Installed PSU below raw draw is ERROR; below recommended headroom is WARNING.

The report includes overall `SUCCESS|WARNING|ERROR|INCOMPLETE`, ordered issues, checked rule count,
system draw, and recommended PSU wattage. Each issue contains rule code, severity, message, affected
hardware IDs, expected value, and actual value.

`GET /api/compatibility/check` accepts optional hardware keys for each Builder category and returns
the same report used by build analysis.

## 6. Performance Engine

Build profiles are weighted from category-specific reviewed scores:

| Profile | CPU | GPU | RAM | Storage |
|---|---:|---:|---:|---:|
| Gaming | 30% | 50% | 10% | 10% |
| Creator | 40% | 30% | 15% | 15% |
| AI | 20% | 60% | 15% | 5% |

An absent category contributes zero and marks the result incomplete. Overall is the rounded mean of
the three profile scores. The API returns the score and the four weighted contributions for
explainability.

## 7. Budget Engine

The Builder owns a non-negative budget. The server returns:

- `limit`, `current`, `remaining`, `overage`
- `status=WITHIN|NEAR_LIMIT|OVER`
- `utilizationPercent`

`NEAR_LIMIT` starts at 90%. No marketplace price is implied; V1 clearly labels values as PC LAB
internal reference prices.

## 8. Build Optimizer

`POST /api/build/optimize` is deterministic and does not invoke an LLM.

Optimization priorities:

1. Produce a compatible complete selection.
2. Stay within budget when a feasible catalogue combination exists.
3. Remove clear bottlenecks: flagship CPU/GPU with less than 32GB RAM, inadequate cooler, or
   insufficient PSU headroom.
4. Preserve the user's GPU for gaming/AI unless doing so makes the budget impossible.
5. Prefer the smallest price delta for a meaningful profile improvement.

The response contains the recommended component IDs, projected analysis, ordered suggestions,
reason, price delta, profile delta, and whether the suggestion is automatically applicable. The
Builder only changes after the user activates `应用优化`; suggestions never mutate state silently.

## 9. API contracts

### `POST /api/build/analyze`

Request:

```json
{
  "revision": 12,
  "budget": 10000,
  "components": {
    "cpu": "cpu-amd-7800x3d",
    "gpu": "gpu-nvidia-rtx5080",
    "motherboard": "motherboard-b650-lab",
    "ram": "ram-ddr5-32gb",
    "storage": "storage-nvme-1tb",
    "cooling": "cooling-aio-240",
    "power_supply": "psu-850w-gold",
    "case": "case-future-glass"
  }
}
```

Response data contains the same `revision`, authoritative total price/system draw, compatibility,
performance, and budget reports. The client applies a response only when its revision still equals
the current Builder revision.

### `POST /api/build/optimize`

Uses the same request plus `goal=balanced|gaming|creator|ai`. Returns a recommended selection,
analysis, and explanations.

### Admin rule API

- `GET /api/admin/compatibility-rules`
- `POST /api/admin/compatibility-rules`
- `PUT /api/admin/compatibility-rules/{id}` with optimistic `version`
- `PUT /api/admin/hardware/{id}/performance`

Existing hardware create/edit, price, category, and model upload endpoints remain unchanged.

## 10. Frontend integration

### Builder

- `BuilderStoreProvider` starts empty and invokes the real Hardware API once mounted.
- Loading preserves workspace geometry; failure shows a precise backend recovery action and retry.
- Selection increments a revision, updates local derived values immediately, then requests server
  analysis. The latest revision wins.
- Budget is editable in the toolbar and drives budget state in the summary.
- The optimization panel displays deterministic suggestions and an explicit apply action.
- Three.js continues consuming the selected `Hardware` objects. API model URLs and variants flow
  through the existing Model Registry without a second hardware source.

### Hardware Explorer

`/hardware` is a technical database, not a product grid. Desktop uses a compact filter rail,
query/metric toolbar, and data-led result rows. Mobile uses sticky category/sort controls and a
single-column result stack. Each result exposes brand/model, decisive category specification,
gaming/creator/AI score, power, internal price, model readiness, and `在 Builder 中使用`.

States: loading skeleton, ready, filtered empty, API error with retry, keyboard focus, and active
filter summary. Query state is reflected in the URL so searches can be shared or restored.

### Hardware CMS

`/admin/hardware` reuses the existing session-scoped Admin Key pattern. It has three workspaces:

1. Dashboard: search catalogue, create/edit identity/specification/performance, publication state.
2. Model Manager: inspect primary/LOD records and upload GLB plus transform/animation metadata.
3. Compatibility Manager: enable, create, edit, prioritize, and version rules.

Admin controls use explicit labels and conflict feedback; raw credentials never enter URL or local
storage.

## 11. Cache, errors, and security

- Redis caches hardware lists/details and enabled rules. Hardware/rule/model/performance mutations
  evict affected caches.
- Analysis responses may be cached by a stable component/budget fingerprint for 60 seconds.
- Unknown hardware, duplicate categories, invalid ranges, optimistic conflicts, and missing
  specifications use typed domain errors translated by the existing global exception boundary.
- Public list/analyse routes remain under the existing rate limiter. Admin mutations require the
  existing Admin Key interceptor and validated payloads.
- Database credentials remain environment variables. Local verification may use the user's MySQL
  account, but no password is committed.

## 12. Verification and acceptance

- Migration contract tests prove all columns, tables, constraints, indexes, and required seed rows.
- Unit tests cover each compatibility rule, PSU rounding, profile weighting, budget thresholds, and
  optimizer bottleneck/budget decisions using Given/When/Then structure.
- Controller tests cover query validation and the four required public API contracts.
- Frontend tests cover Zod parsing, real catalogue bootstrap, stale-analysis rejection, budget state,
  optimizer application, search filters, and error recovery.
- Real browser QA covers `/builder`, `/hardware`, and `/admin/hardware` at 1280px, 768px, and 375px;
  keyboard use, loading/error/empty states, selection-to-3D continuity, compatibility conflict,
  over-budget feedback, and optimization application are exercised.
- Final gates are full Maven tests, Biome, TypeScript, Vitest, production Next.js build, React Doctor,
  design-token scan, and a clean Git diff.

## 13. Explicit non-goals

- No Taobao/JD/PDD adapter changes or marketplace pricing.
- No community features, user accounts, or AI chat.
- No crawler.
- No licensed GLB creation; procedural fallback remains valid when a database model is unavailable.
