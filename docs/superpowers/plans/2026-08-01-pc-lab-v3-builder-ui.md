# PC LAB 3D V3 Builder UI Implementation Plan

> **Status:** approved for autonomous execution on `codex/v3-builder-ui`.
> **Scope:** frontend Builder workspace only. No live Three.js model, Community, AI chat,
> marketplace experience, authentication, or backend changes.

## Objective

Replace the public V2 engine-demo entry with a professional, tool-first PC Builder workspace at
`/builder`. Preserve all existing domain logic and legacy surfaces in source, but remove AI,
price-comparison, and real-3D dependencies from the new runtime path. The finished UI must work at
1440px, 1024px, and 390px, use a token-driven dark system, and support hardware search, category
navigation, selection, build analysis, viewport modes, local save feedback, and responsive sheets.

## Locked decisions

- The repository does **not** contain Tailwind. Keep the established CSS Modules + CSS Variables
  stack instead of adding a parallel styling system.
- Reuse Next.js, TypeScript, Zustand, Framer Motion, existing hardware domain calculators, and mock
  hardware fixtures.
- Use a Builder-scoped Zustand store seeded by `mockHardware` for this UI-only phase. Live API
  catalogue wiring remains available in the legacy store and returns in the later integration
  phase.
- `/` redirects to `/builder`; the legacy Engine Demo stays in source with `@deprecated` markers.
- `Share` is visible but disabled with a reason because Build sharing is explicitly deferred.
- No Canvas, WebGL, procedural PC, marketplace dialog, or AI assistant is imported by `/builder`.
- Chinese is the primary interface language; official hardware names remain Latin.

## User and accessibility checks

- **Primary user:** an enthusiast configuring a machine while comparing technical consequences.
  They must always see the active category, selected part, price, power, performance, and
  compatibility without navigating to a separate page.
- **Keyboard user:** all categories, hardware options, viewer modes, save, and responsive sheet
  controls must be reachable with a visible focus ring.
- **Low-motion user:** sheets and selection feedback reduce to short opacity transitions under
  `prefers-reduced-motion`.
- **Narrow/CJK stress case:** Chinese labels must not clip or orphan at 390×844, and official model
  names must ellipsize without hiding category/status labels.

## Task 1 — Freeze legacy runtime and update the design contract

**Files**

- Modify: `DESIGN.md`
- Create: `docs/deprecations/pc-lab-v3-ui-deprecations.md`
- Create: `src/styles/tokens.css`
- Create: `src/styles/v3-base.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/builder/page.tsx`
- Modify: `src/features/engine/EnginePageClient.tsx`
- Modify: `src/features/engine/EngineDemo.tsx`
- Modify: `src/features/builder/components/ComponentSelector.tsx`
- Modify: `src/features/builder/components/BuildSummary.tsx`
- Modify: `src/features/ai/assistant/AiAssistant.tsx`

**Test first**

1. Add a route-boundary test that asserts the new Builder workspace does not import legacy AI,
   price-comparison, or real Three.js viewer modules.
2. Run it and confirm RED because `/builder` and the V3 workspace do not exist.
3. Add the route, namespaced V3 tokens, metadata, root redirect, and deprecation annotations.
4. Run the focused test and the existing suite.

**Acceptance**

- The V3 token table, typography, spacing, surfaces, primitives, states, motion, responsive rules,
  accessibility constraints, and accepted debt are documented before components consume them.
- Legacy files remain present and compilable but are absent from the `/builder` import graph.

## Task 2 — Establish the scoped Builder store and layout primitives

**Files**

- Create: `src/features/builder/store/BuilderStoreProvider.tsx`
- Create: `src/features/builder/store/BuilderStoreProvider.test.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/AppShell.module.css`
- Create: `src/components/layout/Panel.tsx`
- Create: `src/components/layout/Panel.module.css`
- Create: `src/features/builder/workspace/BuilderWorkspace.tsx`
- Create: `src/features/builder/workspace/BuilderWorkspace.module.css`

**Test first**

1. Assert the provider starts with all eight mock categories installed and exposes recalculated
   totals after a selection.
2. Assert the AppShell exposes header/main landmarks and the three named workspace regions.
3. Confirm RED, implement the minimum provider/primitives, then refactor styles to V3 tokens.

**Acceptance**

- The workspace has a stable toolbar + main layout and no layout shift between loading and ready.
- Desktop grid uses 280px / minmax center / 360px with 8px gaps and 32px outer insets at 1440px.
- Reusable surfaces consume only semantic tokens from `src/styles/tokens.css`.

## Task 3 — Implement BuilderToolbar and real save states

**Files**

- Create: `src/features/build/BuilderToolbar.tsx`
- Create: `src/features/build/BuilderToolbar.module.css`
- Create: `src/features/build/BuilderToolbar.test.tsx`
- Create: `src/features/build/useBuildDraft.ts`
- Create: `src/features/build/useBuildDraft.test.tsx`

**Test first**

1. Assert inline build-name edit supports Enter commit and Escape cancel.
2. Assert `Save` transitions dirty → saving → saved and writes a versioned BuildConfig to
   localStorage.
3. Assert Share remains disabled and exposes the deferred reason.
4. Assert compact controls expose Components/Summary launchers without hiding health values from
   assistive technology.

**Acceptance**

- Toolbar is 64px desktop / 56px mobile with 44px action targets.
- Save feedback uses text, not a decorative status LED; numbers use tabular figures.

## Task 4 — Implement HardwareLibrary and HardwareItem

**Files**

- Create: `src/features/hardware/hardwarePresentation.ts`
- Create: `src/features/hardware/hardwarePresentation.test.ts`
- Create: `src/features/hardware/HardwareLibrary.tsx`
- Create: `src/features/hardware/HardwareLibrary.module.css`
- Create: `src/features/hardware/HardwareLibrary.test.tsx`
- Create: `src/features/hardware/HardwareItem.tsx`
- Create: `src/features/hardware/HardwareItem.module.css`
- Create: `src/features/hardware/ComponentSlotRail.tsx`
- Create: `src/features/hardware/ComponentSlotRail.module.css`

**Test first**

1. Assert all category-specific specifications format deterministically.
2. Assert search filters only the active category and exposes a useful empty state.
3. Assert category selection and hardware selection update the scoped Zustand store.
4. Assert installed, selected, conflict, disabled, and loading semantics use text/ARIA, not only
   color.

**Acceptance**

- Desktop rows match the 240×40 slot and 240×72 option reference geometry.
- Hover does not scale; selection uses a restrained left edge and stable card dimensions.
- Hardware copy is technical and compact, never marketplace-like.

## Task 5 — Implement the lazy viewport placeholder and mode controls

**Files**

- Create: `src/features/builder/viewport/ThreeDViewport.tsx`
- Create: `src/features/builder/viewport/ThreeDViewport.module.css`
- Create: `src/features/builder/viewport/ThreeDViewport.test.tsx`
- Create: `src/features/builder/viewport/ViewportLoader.tsx`

**Test first**

1. Assert Build, Exploded, Airflow, and Studio modes behave as a labelled single-select control.
2. Assert the placeholder explains that real 3D integration is the next phase and still exposes
   camera/loading regions without pretending to render a model.
3. Assert reduced-motion mode does not rely on continuous animation.

**Acceptance**

- The viewport module is dynamically imported as a client-only leaf.
- Stage geometry stays stable across loading/ready and uses no Canvas or Three.js import.

## Task 6 — Implement BuildPanel analysis

**Files**

- Create: `src/features/build/BuildPanel.tsx`
- Create: `src/features/build/BuildPanel.module.css`
- Create: `src/features/build/BuildPanel.test.tsx`
- Create: `src/features/build/PerformanceCard.tsx`
- Create: `src/features/build/PriceCard.tsx`
- Create: `src/features/build/CompatibilityCard.tsx`

**Test first**

1. Assert all eight current selections render in order.
2. Assert Gaming, Rendering, and AI scores remain separate and update after selection.
3. Assert total price, power, and compatibility status update from the same store revision.
4. Assert warning/error outcomes include a named reason and issue count.

**Acceptance**

- Right panel remains 360px desktop, has a sticky total/actions region, and never collapses scores
  into one unexplained badge.
- `Optimize Build` and marketplace controls are absent from this phase.

## Task 7 — Responsive sheet orchestration

**Files**

- Create: `src/components/overlays/BottomSheet.tsx`
- Create: `src/components/overlays/BottomSheet.module.css`
- Create: `src/components/overlays/BottomSheet.test.tsx`
- Create: `src/features/builder/workspace/WorkspaceMobileControls.tsx`
- Create: `src/features/builder/workspace/WorkspaceMobileControls.module.css`
- Modify: `src/features/builder/workspace/BuilderWorkspace.tsx`
- Modify: `src/features/builder/workspace/BuilderWorkspace.module.css`

**Test first**

1. Assert only one Components/Summary sheet can be open at a time.
2. Assert Escape closes the sheet and focus returns to its launcher.
3. Assert mobile category selection opens Components and preserves the active category.
4. Assert the overlay has dialog semantics, a labelled close action, and a non-nested structure.

**Acceptance**

- Tablet uses 320px left / 340px right docked sheets; mobile uses max-58dvh Components and
  full-height Summary variants.
- The viewport remains the primary visible surface and vertical page/sheet scrolling is not
  intercepted.

## Task 8 — Verification, visual QA, and release

**Automated checks**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:run`
- `pnpm build`
- `pnpm doctor -- --json` (record tool compatibility/result; do not suppress findings)
- TypeScript no-excuse audit for changed TS/TSX files.

**Real-surface checks**

- Production screenshots: 1440×1024, 1024×768, 390×844.
- Interactions: search, eight category navigation, hardware selection, four viewport modes, inline
  rename, save states, Components sheet, Summary sheet, Escape/focus restoration.
- Keyboard: tab order, visible focus, Enter/Space activation, Escape, no focus trap in viewport.
- Responsive: no horizontal overflow, no hidden total/save, no clipped CJK or hardware names.
- Scope audit: `/builder` import graph contains no AI assistant, price comparison, PCViewer, Canvas,
  WebGL, Community, or marketplace code.

**Git release**

1. Review full diff and keep plan/docs, implementation/tests, and QA fixes in atomic commits.
2. Push `codex/v3-builder-ui` to `origin`.
3. Tag the verified release `pc-lab-builder-ui-v3.0.0` and push the tag.

## Done definition

- `/builder` renders a professional dark Builder workspace with left hardware library, central
  placeholder stage, right analysis, and meaningful responsive sheets.
- User selection updates price, power, performance, compatibility, and installed states in one
  understandable sequence.
- Old UI remains recoverable in source and is explicitly deprecated.
- All automated checks pass and fresh screenshots prove desktop/tablet/mobile behavior.
- No real 3D model, AI chat, Community, marketplace, or backend feature is added.
