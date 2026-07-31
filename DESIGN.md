# PC LAB 3D Design System

## 0. Research Log

- Embedded references: PC LAB 3D Product Design V2.0, Porsche-style configurator, NVIDIA future lab, Apple product presentation; execution references selected `gpt-tasteskill` + `apple` because the approved direction is cinematic, product-first, and mechanically precise.
- Lazyweb: skipped because the user supplied a complete high-fidelity visual specification and requested implementation rather than renewed visual research.
- Imagen drafts: skipped because the focal visual is a real-time Three.js assembly and the approved specification already defines its composition.
- Scope: this document covers Engine V1.0, Builder V1.0, Hardware Platform
  V1.0, Price Intelligence V1.0, and AI Builder V1.0. Live marketplace feeds,
  accounts, and community remain outside this phase.
- Price Intelligence extension: the Admin workspace uses an operational,
  Apple-commerce-inspired density while retaining PC LAB graphite materials.
  Price data, provenance, and stale state stay visually stronger than chrome.

## 1. Atmosphere & Identity

PC LAB 3D feels like a precision computing laboratory rather than a store. The signature is an illuminated computer assembly suspended in a deep graphite stage: cool cyan rim light reveals material edges, quiet glass controls sit around the model, and every motion explains assembly state. The computer is always the strongest visual layer.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|---|---|---|---|
| Canvas | `--color-bg-canvas` | `#05070b` | Page background |
| Stage | `--color-bg-stage` | `#070b12` | 3D viewport |
| Panel | `--color-surface-panel` | `#0b111b` | Primary glass panels |
| Card | `--color-surface-card` | `#101826` | Controls and cards |
| Elevated | `--color-surface-elevated` | `#162235` | Popovers and selected states |
| Hover | `--color-surface-hover` | `#1a2940` | Hover state |
| Text primary | `--color-text-primary` | `#f5f8fc` | Titles and values |
| Text secondary | `--color-text-secondary` | `#a9b4c3` | Body and labels |
| Text muted | `--color-text-muted` | `#8290a4` | AA-safe metadata and 11px telemetry |
| Primary | `--color-primary` | `#65e6ff` | Main action and selection |
| Primary hover | `--color-primary-hover` | `#9af0ff` | Hover |
| Primary pressed | `--color-primary-pressed` | `#28d1f4` | Pressed |
| AI accent | `--color-accent-ai` | `#8c7bff` | Secondary spectral accent |
| RGB accent | `--color-accent-rgb` | `#ff4fc6` | Controlled RGB highlight |
| Success | `--color-success` | `#5be6a8` | Ready and locked |
| Warning | `--color-warning` | `#ffba5c` | Degraded state |
| Danger | `--color-danger` | `#ff6474` | Asset or action failure |
| Focus | `--color-focus` | `#b7f3ff` | Keyboard focus |
| Border | `--color-border` | `rgba(183, 243, 255, 0.14)` | Subtle separation |
| Warning subtle | `--color-warning-subtle` | `rgba(255, 186, 92, 0.09)` | Advisory background |
| Warning border | `--color-warning-border` | `rgba(255, 186, 92, 0.28)` | Advisory boundary |
| Danger subtle | `--color-danger-subtle` | `rgba(255, 100, 116, 0.09)` | Blocking issue background |
| Danger border | `--color-danger-border` | `rgba(255, 100, 116, 0.30)` | Blocking issue boundary |
| AI subtle | `--color-ai-subtle` | `rgba(140, 123, 255, 0.10)` | Recommendation surface |
| AI border | `--color-ai-border` | `rgba(140, 123, 255, 0.28)` | Recommendation boundary |
| Backdrop | `--color-backdrop` | `rgba(2, 5, 9, 0.76)` | Modal stage dimming |

### Rules

- Cyan is reserved for action, selection, and active telemetry.
- Magenta is limited to RGB feedback and never competes with the primary action.
- Background depth uses multiple tonal stops; flat black is not a complete stage.
- All status communication includes text or iconography and never depends on color alone.

## 3. Typography

### Font Stack

- Display and UI: Space Grotesk Variable, system sans-serif fallback.
- Chinese and body: Noto Sans SC Variable, system sans-serif fallback.
- Data: Space Grotesk with tabular numbers.

### Scale

| Level | Size | Weight | Line height | Tracking | Usage |
|---|---:|---:|---:|---:|---|
| Display | 48px | 600 | 1.08 | -0.02em | Engine title |
| H1 | 34px | 600 | 1.15 | -0.02em | Mobile title |
| H2 | 28px | 600 | 1.2 | -0.01em | Section title |
| H3 | 20px | 600 | 1.3 | 0 | Panel title |
| Body | 16px | 400 | 1.6 | 0 | Main copy |
| Body small | 14px | 400 | 1.5 | 0 | Controls |
| Label | 12px | 600 | 1.3 | 0.06em | Technical labels |
| Micro | 11px | 500 | 1.3 | 0.04em | Telemetry |

## 4. Spacing & Layout

### Base Unit

All UI spacing derives from 4px.

| Token | Value |
|---|---:|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

### Viewer Layout

- Desktop reference viewport: 1440 × 1024.
- Mobile reference viewport: 390 × 844.
- Engine demo uses a full-viewport 3D stage with a 64px desktop header and floating control panels.
- Mobile uses a 56px header, a compact top status row, and a bottom control sheet.
- Minimum interactive target is 44 × 44px.

## 5. Components

### Engine Header

- Structure: brand, engine status, quality indicator.
- States: ready, loading, degraded, error.
- Accessibility: semantic header and live status text.

### Viewer Toolbar

- Structure: grouped icon buttons for reset, internal focus, exploded view, and RGB.
- States: default, hover, active, focus, disabled.
- Motion: 140ms interaction feedback; no decorative looping motion.

### Component Rail

- Structure: eight category tabs, hardware visual, name, compact specification,
  performance index, price, selection and compatibility state.
- States: default, hover, selected, replacing, disabled, incompatible.
- Accessibility: radio-like selected semantics and full keyboard reachability.

### Build Summary

- Structure: machine identity, selected component rows, total price, system draw,
  gaming/production/AI scores, compatibility results, save action.
- States: ready, recalculating, success, warning, error, saved.
- Motion: price and score values roll over 320ms; compatibility messages crossfade
  in 180ms.

### Smart Preset Dialog

- Structure: budget input, gaming/productivity/AI intent tabs, recommendation
  preview, reasons, apply action.
- States: idle, calculated, over-budget, applying.
- Accessibility: labelled dialog, trapped intent through native controls, close and
  apply actions remain keyboard reachable.

### Change Feedback

- Structure: compact price and performance deltas attached to the active rail.
- States: gain, loss, neutral, compatibility recalculation.
- Motion: enter with an 8px vertical offset and fade; exit with opacity only.

### Loading Overlay

- Structure: progress ring, current asset, fallback explanation.
- States: loading, retrying, degraded, fatal.
- Accessibility: polite live region; percentages exposed as progress values.

### Price Admin Workspace

- Structure: 64px utility header, five-metric telemetry strip, filter toolbar,
  product list, and contextual editor drawer.
- States: locked, loading, ready, filtered, empty, stale, saving, success, error.
- Desktop: compact table with one selected product and a 420px contextual drawer.
- Mobile: product cards with a full-screen editor, a horizontally scrollable
  metric rail, and a dedicated filter bottom sheet for platform, category,
  publication state, and match state. Primary actions remain at least 44px tall.
- Security: Admin Key is session-scoped, masked by default, and never appears in
  route state or persistent storage.

### Product & Offer Editor

- Structure: product identity, hardware match preview, confidence explanation,
  offer terms, calculated final price, provenance, and save action.
- States: create, edit, unmatched, review required, confirmed, optimistic
  conflict, invalid, saving, saved.
- Final price is always shown beside the raw price and promotion breakdown.
- Destructive actions require a named text action and never depend on icon color.
- `INTERNAL` products and offers are immutable at both the interface and API
  boundary; the editor presents them as reference-only records.
- Match preview and match confirmation are distinct actions. A platform offer
  cannot be treated as published inventory until an operator confirms its
  hardware target.

### Price Comparison Dialog

- Structure: eight-category selected-hardware switcher, selected hardware
  header, lowest-price signal, reliable-merchant recommendation, offer rows,
  7/30-day trend, update time, shipping and sales details, and manual/affiliate
  disclosure.
- States: loading, ready, no offers, stale data, history loading, history empty,
  error.
- Desktop: centered 920px dialog with split comparison/history regions.
- Mobile: full-height bottom sheet with a sticky close action and compact sticky
  lowest-price/reliable-merchant summary beneath the category switcher.
- Purchase links always target the internal tracked redirect endpoint.
- Opening defaults to the configured GPU on every breakpoint. Focus moves into
  the dialog, remains trapped while open, background content is isolated, and
  focus returns to the launch control on close.

### Price Trend Chart

- Structure: minimum-price line, date endpoints, low/high values, and percent
  movement.
- States: 7-day, 30-day, empty, loading.
- The chart uses a semantic SVG title/description and retains a textual price
  summary for non-visual access.

### AI Diagnostic Port

- Structure: 48px launcher, cyan activity notch, AI-violet spectral edge,
  advisor status and unread/result signal.
- Placement: desktop right 24px / bottom 88px; mobile inside the bottom action
  layer without covering the 3D toolbar.
- States: idle, analysing, proposal ready, applying, complete, clarification,
  recoverable error and offline.
- The launcher is the only persistent AI accent. It never competes with the
  cyan Builder selection language or the computer model.

### AI Build Advisor Panel

- Structure: compact instrument header, transcript, task presets, proposal,
  evidence disclosure, sticky composer and apply action.
- Desktop: 392px wide, up to 680px tall, floating above the Builder stage with
  the existing mixed tonal glass recipe.
- Mobile: full-width bottom sheet with a 72dvh maximum height, sticky composer
  and one-column component changes.
- States: welcome, composing, analysing, proposal, confirmation required,
  applying, applied, clarification and service failure.
- Initial compatible builds may apply automatically. Multi-part modifications
  expose one explicit “应用整套调整” action before replacing scene assets.
- Focus enters the panel, remains trapped while open and returns to the launcher
  on close. Status changes are announced through a polite live region.

### AI Operations Workspace

- Structure: protected access gate, six-metric telemetry rail, Prompt,
  Knowledge, Rules and Logs workspaces, contextual editor.
- Prompt content uses a code-like reading surface but remains a native labelled
  textarea. Publishing is a named action and shows the new optimistic version.
- Knowledge rows expose category, provenance, revision and vector-sync state;
  raw user messages never appear in the log workspace.
- Dense operational information uses border-led containment and restrained
  depth, keeping the Admin surface distinct from the cinematic Builder stage.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|---|---:|---|---|
| Micro | 80–140ms | ease-out | Button feedback |
| Standard | 180–320ms | cubic-bezier(0.2, 0.8, 0.2, 1) | Panels and selection |
| Focus | 480–600ms | cubic-bezier(0.16, 1, 0.3, 1) | Camera focus |
| Mechanical | 800–1500ms | power3.out | Installation and exploded view |

Rules:

- Animate transform, opacity, emissive intensity, and camera values.
- Installation motion communicates physical order: float, align, insert, lock, glow.
- Reduced motion uses direct placement plus a short opacity transition.
- Every visible motion must correspond to selection, loading, replacement, or assembly state.
- Numerical changes use tabular figures and never alter surrounding layout width.
- Admin editor drawers enter over 240ms with opacity plus horizontal transform;
  their midpoint must remain visually distinguishable from the settled state.
- AI advisor opens over 240ms with opacity plus an 8px vertical transform;
  analysis uses a static progress rail with one moving highlight, never a
  decorative looping mascot.
- AI proposal application delegates motion to the existing 800–1500ms
  mechanical installation queue; the chat panel itself does not imitate part
  installation motion.
- A replacement that is incompatible remains selectable so users can understand
  the rule, but its blocking reason is announced before save.

## 7. Depth & Surface

Strategy: mixed tonal shift plus restrained glass.

- Stage: multi-stop radial background with cyan and violet spill.
- Glass panel: dark tint, 24px blur, subtle cyan border, inner top sheen, deep shadow.
- Selected control: cyan edge glow with no large diffuse neon cloud.
- Product materials create most of the depth; UI chrome remains visually thin.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target for the HTML interface.
- Visible keyboard focus on every control.
- Buttons and labels remain usable when WebGL fails.
- `prefers-reduced-motion` disables nonessential camera and assembly travel.
- Pointer gestures have visible button alternatives.
- Status messages are exposed through live regions.

### Accepted Debt

| Item | Location | Why accepted | Exit |
|---|---|---|---|
| Procedural placeholder geometry | Engine demo | The repository contains no licensed GLB assets | Replace per component when validated GLB packages arrive |
| Procedural environment instead of production HDR | Lighting system | No licensed HDR has been supplied | Replace through the environment manifest without changing viewer APIs |
| Internal reference prices | Hardware Platform | They remain the fallback when no reviewed offer exists | Keep them distinct from marketplace quotes in every UI |
| Manual marketplace quotes | Price Intelligence | V1 intentionally uses reviewed Admin data and no crawler or live marketplace API | Replace each manual adapter with approved affiliate adapters while preserving the normalized offer contract |
| Limited style/noise metadata | AI Builder | The hardware catalogue does not yet carry verified colour and acoustic measurements for every item | Add reviewed hardware-profile attributes; until then disclose unfulfilled preferences |
| Optional dense-vector service | AI Builder RAG | MySQL and Redis are guaranteed locally, but no Chroma/Milvus endpoint or embedding credential is guaranteed | Enable the Chroma adapter when approved infrastructure is configured; retain deterministic MySQL retrieval as fallback |
