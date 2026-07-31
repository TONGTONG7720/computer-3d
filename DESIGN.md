# PC LAB 3D Design System

## 0. Research Log

- Embedded references: PC LAB 3D Product Design V2.0, Porsche-style configurator, NVIDIA future lab, Apple product presentation; execution references selected `gpt-tasteskill` + `apple` because the approved direction is cinematic, product-first, and mechanically precise.
- Lazyweb: skipped because the user supplied a complete high-fidelity visual specification and requested implementation rather than renewed visual research.
- Imagen drafts: skipped because the focal visual is a real-time Three.js assembly and the approved specification already defines its composition.
- Scope: this document covers the Engine V1.0 viewer and controls only; commerce, price, AI, and account surfaces are outside this phase.

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
| Text muted | `--color-text-muted` | `#718095` | Nonessential metadata |
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

- Structure: hardware category, hardware name, selection state.
- States: default, hover, selected, replacing, unavailable.
- Accessibility: radio-like selected semantics and full keyboard reachability.

### Telemetry Panel

- Structure: selected component, viewer mode, model source, performance status.
- States: ready, loading, placeholder, error.
- Motion: values crossfade in 180ms.

### Loading Overlay

- Structure: progress ring, current asset, fallback explanation.
- States: loading, retrying, degraded, fatal.
- Accessibility: polite live region; percentages exposed as progress values.

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

