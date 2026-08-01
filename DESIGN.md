# PC LAB 3D Design System

> **Current contract: V3.0 Professional Hardware Lab.** The V2 cinematic engine system remains
> below as a deprecated compatibility reference for legacy Admin and Engine Demo surfaces. New
> public product UI must implement the V3 contract in this section and consume `src/styles/tokens.css`.

## V3.0 — Product brief

PC LAB 3D is a professional 3D computer design workspace. The Builder is the product, not a
marketing destination, marketplace, forum, or chat client. Its stable three-region grammar is a
technical component library, a dominant inspection stage, and a persistent build analysis panel.

### Primary journeys

1. Choose one of eight component categories.
2. Compare concise technical options without leaving the workspace.
3. Select a part and immediately understand price, power, performance, and compatibility changes.
4. Save the local Build. Sharing, marketplace comparison, AI optimization, and real 3D integration
   remain separate later phases.

### Inclusive personas and stress conditions

- **Technical builder:** scans official model names and category-specific specifications quickly;
  selection, installed, and conflict states must never depend on color alone.
- **Keyboard builder:** completes category navigation, search, part selection, viewport mode switch,
  rename, save, and responsive-sheet dismissal without pointer gestures.
- **Narrow-screen builder:** preserves maximum viewer area at 390px while opening Components and
  Summary as non-nested sheets with 44px targets.
- **Low-motion builder:** receives direct state changes and short opacity feedback instead of travel,
  shimmer, pulsing, or looping decoration.

## V3.1 — Atmosphere and hierarchy

The interface resembles a calibrated hardware workstation: opaque graphite panels, restrained
blue selection language, thin borders, compact technical typography, and one quiet stage grid.
Persistent panels never float. Glass is limited to controls over the future 3D viewport. Blue
communicates selection, focus, or a primary action; it is not ambient decoration.

The visual hierarchy is fixed:

1. 3D workspace / placeholder stage.
2. Active component option and build consequence.
3. Persistent configuration and analysis.
4. Toolbar identity and actions.

## V3.2 — Semantic tokens

### Color

| Token | Value | Purpose |
|---|---|---|
| `--bg-app` | `#080808` | Application canvas |
| `--bg-stage` | `#0d0f12` | Viewer stage |
| `--surface` | `#111111` | Header/base surface |
| `--panel` | `#161616` | Persistent panel/card |
| `--surface-hover` | `#1c1c1c` | Hover/elevated row |
| `--surface-raised` | `#202020` | Popover/sheet handle region |
| `--border` | `#252525` | Default divider |
| `--border-strong` | `#343434` | Focused separation |
| `--text-primary` | `#f5f5f5` | Primary copy |
| `--text-secondary` | `#a3a3a3` | Body/metadata |
| `--text-muted` | `#737373` | Quiet metadata |
| `--text-disabled` | `#525252` | Unavailable state |
| `--primary` | `#3b82f6` | Selection/focus |
| `--primary-hover` | `#60a5fa` | Hover emphasis |
| `--primary-pressed` | `#2563eb` | Filled action with white text |
| `--primary-soft` | `rgba(59, 130, 246, 0.12)` | Selected surface |
| `--success` | `#22c55e` | Compatible/installed |
| `--success-soft` | `rgba(34, 197, 94, 0.1)` | Success surface |
| `--warning` | `#f59e0b` | Consideration |
| `--warning-soft` | `rgba(245, 158, 11, 0.1)` | Warning surface |
| `--danger` | `#ef4444` | Blocking conflict/error |
| `--danger-soft` | `rgba(239, 68, 68, 0.1)` | Error surface |
| `--backdrop` | `rgba(0, 0, 0, 0.72)` | Responsive sheet backdrop |

### Typography

- UI/display: Geist Variable when available, then Space Grotesk Variable.
- Chinese/body: Noto Sans SC Variable.
- Numeric data: UI stack with `font-variant-numeric: tabular-nums`.

| Token | Size / line | Weight | Use |
|---|---|---:|---|
| `--type-page` | 32 / 38px | 600 | Page title |
| `--type-section` | 24 / 30px | 600 | Major section |
| `--type-panel` | 18 / 24px | 600 | Panel title |
| `--type-body` | 14 / 22px | 400 | Tool copy |
| `--type-body-strong` | 14 / 20px | 600 | Model/value |
| `--type-label` | 12 / 16px | 600 | Category/state |
| `--type-micro` | 11 / 15px | 500 | Technical metadata |
| `--type-price` | 32 / 36px | 600 | Total price |

### Spacing, radius, depth, and motion

- Spacing tokens: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px.
- Radii: 8px control/row, 12px panel/card/popover, 20px modal/sheet.
- Persistent surfaces use a 1px border and no diffuse glow.
- Elevated overlay: `0 16px 40px rgba(0, 0, 0, 0.36)`.
- Focus: 2px primary ring plus 2px dark offset.
- Feedback: 100–160ms ease-out; sheets: 200ms cubic-bezier(0.2,0,0,1); selection:
  300ms cubic-bezier(0.2,0.8,0.2,1); numerical update: 280–360ms ease-out.
- Animate transform and opacity only. No panel-dimension animation, scale-on-card-hover, infinite
  shimmer, pulsing border, scanline, floating label, or decorative loop.

## V3.3 — Layout contract

### Desktop 1440 × 1024

- Toolbar: 64px.
- Main grid: 32px outer insets, 8px gaps, 944px working height.
- Columns: 280px Component Library / 720px reference Viewer / 360px Build Panel.
- Persistent panels are opaque tonal surfaces with 1px borders.

### Tablet 1024 × 768

- Viewer stays persistent.
- Components use a 320px left docked sheet; Summary uses a 340px right docked sheet.
- Only one sheet is open at a time; toolbar launchers expose current state badges.

### Mobile 390 × 844

- Toolbar: 56px.
- Viewer: 42–46dvh with an unclipped 358×40px mode switcher.
- Component category rail: horizontal, 48px high.
- Hardware options: bottom sheet up to 58dvh.
- Summary: separate full-height sheet with sticky total and save action.
- No nested interactive sheets; all controls are at least 44×44px.

## V3.4 — Primitive and component contract

| Primitive/component | Required states |
|---|---|
| `AppShell` | default, compact, mobile |
| `Panel` | default, scrolling, collapsed, error |
| `BuilderToolbar` | clean, dirty, saving, saved, error; inline name edit |
| `ComponentSlotRail` | empty, active, installed, warning, conflict |
| `HardwareItem` | default, hover, focus, selected, installed, conflict, loading, disabled |
| `ThreeDViewport` | loading, placeholder, degraded; Build/Exploded/Airflow/Studio |
| `BuildConfigRow` | empty, installed, changed, conflict |
| `PerformanceCard` | calculating, ready, incomplete |
| `PriceCard` | internal, updating, up, down |
| `CompatibilityCard` | success, warning, error, rechecking |
| `BottomSheet` | opening, open, closing; focus managed |

Composition rules:

- Components consume semantic variables from `src/styles/tokens.css`; raw colors do not appear in
  component modules.
- Loading states preserve final geometry.
- Status always includes iconography and text.
- Empty and error states include the next useful action.
- Mobile is a responsive variant of the same component tree, not a separate product.

## V3.5 — Accessibility and resilience

- WCAG 2.2 AA target; visible focus on every action; minimum 44px target.
- Focus order: Toolbar → Components → Viewport controls → Summary.
- Sheets close on Escape and restore focus to their launcher.
- Viewport has a descriptive label and never traps focus.
- `prefers-reduced-motion` removes travel and uses at most 120ms opacity feedback.
- Chinese copy uses natural line breaking; technical model names ellipsize only after category and
  state remain understandable.
- Hardware fixtures are explicitly local UI data in this phase; live catalogue provenance returns
  with backend integration.

## V3.6 — Accepted debt and deferred capability

| Item | Location | Reason | Exit |
|---|---|---|---|
| Placeholder viewer | `/builder` stage | Real Three.js integration is the next approved phase | Mount one Canvas behind the stable Viewer contract |
| Local hardware fixtures | Builder-scoped store | This phase validates UI and selection flow independently | Reconnect the Hardware API without changing component geometry |
| Disabled Share | Toolbar | Public Build sharing is deferred | Enable after versioned Build API/public route returns |
| No Optimize action | Build Panel | AI chat and optimization are out of scope | Add the approved non-chat Optimize Build flow later |

---

# Deprecated V2 Cinematic Engine System

> **Deprecated for public runtime.** Retained so existing Engine Demo, Price Admin, and AI Admin
> modules continue to compile while V3 migration proceeds. Do not use these tokens or component
> patterns in new Builder code.

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

### AI Semantic Extension

AI surfaces never declare raw color literals inside component modules. They use
semantic variables from `globals.css` so the Builder advisor and Operations
workspace can evolve without drifting from the core palette.

| Group | Tokens | Usage |
|---|---|---|
| AI text | `--color-ai-text-muted`, `--color-ai-text`, `--color-ai-text-strong`, `--color-ai-text-pale` | Metadata, icons, selected text and primary AI actions |
| AI state | `--color-ai-subtle`, `--color-ai-action`, `--color-ai-action-hover`, `--color-ai-border`, `--color-ai-border-strong` | Recommendation, hover, focus and confirmation states |
| Advisor surfaces | `--color-surface-ai-launcher`, `--color-surface-ai-panel`, `--color-surface-ai-proposal`, `--color-surface-ai-composer`, `--color-surface-ai-input` | Floating advisor depth layers |
| Operations surfaces | `--color-surface-admin`, `--color-surface-admin-strong`, `--color-surface-admin-registry`, `--color-surface-admin-table`, `--color-surface-admin-field` | Admin access, registry, table and editor layers |
| AI depth | `--shadow-ai-launcher`, `--shadow-ai-panel`, `--shadow-admin-panel` | Elevation recipes for the three AI surface classes |
| Accessibility | `--font-size-micro`, `--size-touch-target` | 11px minimum metadata and 44px minimum interactive target |

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
