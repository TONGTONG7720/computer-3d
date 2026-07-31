# PC LAB 3D Builder System V1.0 — Design

## Goal

Turn the existing 3D engine demo into an internal, fully interactive computer
configurator. Any hardware choice updates one typed configuration source of truth,
recalculates price, power, performance and compatibility, and starts the matching
Three.js installation sequence.

## Scope

Builder V1.0 includes:

- CPU, GPU, motherboard, RAM, storage, cooling, PSU and case selection.
- A complete in-memory hardware catalogue with local GLB paths.
- Deterministic price, power, compatibility, performance and recommendation logic.
- Local build saving through versioned browser storage.
- Selection, delta and recalculation feedback through Framer Motion.
- The existing rotate, zoom, pan, internal view, exploded view and RGB controls.

It excludes marketplace feeds, checkout, accounts, AI chat, RAG and backend APIs.

## Architecture

`builderStore` owns business state and derived values. Pure domain services accept a
selection and return immutable results. UI actions update the store first and then
send a serializable replacement command to `engineStore`. The Three.js layer resolves
the hardware manifest, installs a cached or procedural model, and reports animation
status without owning price or compatibility data.

```text
ComponentSelector
  -> builderStore.selectComponent
  -> derived calculators
  -> BuildSummary + change feedback
  -> engineStore.requestReplacement
  -> PCScene / ComponentReplacementManager
  -> install animation + scene commit
```

## Domain Decisions

- Categories use the scene-compatible keys `cpu`, `gpu`, `motherboard`, `ram`,
  `storage`, `cooling`, `power_supply`, and `case`.
- A selection may be incomplete, but the demo starts from a complete compatible
  reference build.
- Compatibility is a list of rule results plus the highest severity. Blocking
  errors do not prevent experimentation; they prevent a configuration from being
  presented as ready.
- PSU headroom is calculated from peak component power plus a fixed platform
  allowance. The rule requires at least 20 percent reserve.
- Performance exposes gaming, production, AI and overall values on a 0–100 scale.
- Recommendations only use catalogue parts and optimize under the requested budget.

## UI Contract

Desktop retains the cinematic full-stage composition: a 316px left configurator,
central WebGL stage, 304px right summary and bottom viewer toolbar. The category row
scrolls within the left panel and hardware cards show a procedural product visual,
compact spec, performance and price.

On mobile, summary becomes a compact top card and the selector becomes a bottom
sheet with horizontal category and product scrolling. Save and recommendation
dialogs remain viewport-contained.

## Acceptance

- Switching CPU or GPU visibly runs the installation status sequence.
- All eight categories update the selected build and derived metrics immediately.
- Every requested compatibility rule can produce a specific human-readable result.
- A budget/use-case recommendation can be applied as one configuration.
- A named build persists to and can be read back from local storage.
- Desktop and mobile render without clipped primary controls.

