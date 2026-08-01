# PC LAB 3D Engine V2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the V3 Builder viewport placeholder with a production-shaped, modular React Three Fiber PC configurator that works without binary assets and is ready to accept optimized GLB/KTX2 assets later.

**Architecture:** The scoped Builder Zustand store remains the source of truth for selected hardware. A dynamically loaded Builder viewer translates those selections into typed model descriptors and independent slot-mounted PC parts; procedural parts are the deterministic runtime fallback while the GLTF/Draco/KTX2 loader, cache, registry, disposal, and progress contracts remain production-ready. Camera, selection, installation, exploded, airflow, RGB, and quality concerns are isolated so the Canvas stays a replaceable rendering leaf rather than becoming application state.

**Tech Stack:** Next.js 16, React 19, TypeScript 6 strict mode, Zustand 5, Three.js 0.185, React Three Fiber 9, Drei 10, GSAP 3, CSS Modules, Vitest 4, Biome 2.

## Global Constraints

- Preserve the V3 Professional Hardware Lab layout and token contract; do not reintroduce marketing particles, scroll storytelling, marketplace, community, or AI chat.
- Builder hardware selection is authoritative; 3D state may never write a conflicting hardware selection back into the Builder.
- Every PC part is independently replaceable, selectable, hideable, and animatable through a typed slot.
- GPU and CPU replacement must visibly pass through remove, load/fallback, install, lock, and glow phases in 800–1500ms using `power3.out`.
- Build, Exploded, Airflow, and Studio are functional modes, not static labels.
- Real asset paths follow `/models/<category>/<asset>.glb`; the current repository must remain fully functional with procedural placeholders.
- Desktop targets 60 FPS and mobile targets at least 30 FPS through adaptive DPR, LOD, conditional shadows, deterministic instancing, lazy loading, and explicit disposal.
- Every new TypeScript property is readonly unless mutation is the purpose; no `any`, enum, non-null assertion, `@ts-ignore`, or default export except Next.js framework files.
- Production TypeScript files stay below 250 pure LOC.

---

### Task 1: 3D design contract and typed slot/camera domain

**Files:**
- Modify: `DESIGN.md`
- Modify: `src/styles/tokens.css`
- Create: `src/three/pc/slots.ts`
- Create: `src/three/pc/slots.test.ts`
- Create: `src/three/animation/CameraAnimation.ts`
- Create: `src/three/animation/CameraAnimation.test.ts`

**Interfaces:**
- Produces: `PCSlotId`, `ComponentSlot`, `componentSlots`, `getComponentSlot(slotId)`.
- Produces: `CameraView`, `CameraPreset`, `cameraPresets`, `getCameraPreset(view)`.

- [ ] **Step 1: Write failing slot and camera tests**

```ts
it("defines every independently replaceable PC mount when the engine starts", () => {
  expect(componentSlots.map((slot) => slot.slotId)).toEqual([
    "pc_case", "motherboard", "cpu_socket", "gpu_slot", "ram_slots",
    "storage_slots", "cooling_mount", "fan_mount", "psu_area",
  ]);
});

it("frames the installation slot more tightly than the default build view", () => {
  expect(getCameraPreset("installation").position[2]).toBeLessThan(
    getCameraPreset("default").position[2],
  );
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `pnpm vitest run src/three/pc/slots.test.ts src/three/animation/CameraAnimation.test.ts`

Expected: FAIL because the slot and camera modules do not exist.

- [ ] **Step 3: Implement immutable slot and camera registries**

Each slot records `slotId`, `componentType`, `position`, `rotation`, `scale`, `installEntry`, and `explodedOffset`. Camera presets record `position`, `target`, and `fov` for `default`, `detail`, `exploded`, and `installation`.

- [ ] **Step 4: Extend the design contract before visual code**

Add a V3.7 3D Experience section naming the physical material palette, stage lighting, slot coordinate system, camera states, mode semantics, RGB behavior, reduced-motion alternative, quality tiers, and accepted procedural-model debt. Add only reusable stage/material control tokens to `tokens.css`.

- [ ] **Step 5: Run targeted tests and commit**

Run: `pnpm vitest run src/three/pc/slots.test.ts src/three/animation/CameraAnimation.test.ts`

Expected: 2 test files pass.

Commit: `Build typed PC slot and camera contracts`

---

### Task 2: Production model registry, loading, cache, and disposal

**Files:**
- Create: `src/three/models/ModelRegistry.ts`
- Create: `src/three/models/ModelRegistry.test.ts`
- Modify: `src/three/models/ModelLoader.ts`
- Modify: `src/three/models/ModelLoader.test.ts`
- Modify: `src/three/models/ModelCache.ts`
- Modify: `src/three/models/ModelCache.test.ts`
- Modify: `public/models/README.md`
- Create: `public/models/cases/.gitkeep`
- Create: `public/models/gpu/.gitkeep`
- Create: `public/models/cpu/.gitkeep`
- Create: `public/models/motherboard/.gitkeep`
- Create: `public/models/ram/.gitkeep`
- Create: `public/models/storage/.gitkeep`
- Create: `public/models/cooling/.gitkeep`
- Create: `public/models/psu/.gitkeep`
- Create: `public/models/decoders/draco/.gitkeep`
- Create: `public/models/decoders/basis/.gitkeep`

**Interfaces:**
- Consumes: `Hardware`, `ComponentSlot`.
- Produces: `ModelDescriptor`, `ModelRegistry.resolve(hardware)`, `ModelRegistry.register(descriptor)`.
- Produces: `ModelLoader.load(descriptor)`, progress/error state, reference-counted release, and `disposeUnused()`.

- [ ] **Step 1: Write failing registry and loader behavior tests**

```ts
it("maps the demo RTX 5090 to the category-scoped production filename", () => {
  expect(registry.resolve(rtx5090)).toMatchObject({
    source: "placeholder",
    url: "/models/gpu/gpu_rtx5090_founder.glb",
  });
});

it("deduplicates concurrent requests for one asset", async () => {
  const [first, second] = await Promise.all([loader.load(manifest), loader.load(manifest)]);
  expect(port.calls).toBe(1);
  expect(first).not.toBe(second);
});
```

- [ ] **Step 2: Run tests and confirm RED for the new registry**

Run: `pnpm vitest run src/three/models/ModelRegistry.test.ts src/three/models/ModelLoader.test.ts src/three/models/ModelCache.test.ts`

Expected: registry import fails while existing cache/loader tests remain green.

- [ ] **Step 3: Implement the registry and strengthen the existing loader**

Use a discriminated `source: "glb" | "placeholder"` descriptor. Configure one reusable `DRACOLoader` at `/models/decoders/draco/`, Meshopt decoding, optional KTX2 at `/models/decoders/basis/`, stable in-flight request deduplication, monotonic progress, typed `ModelLoadError`, SkeletonUtils cloning, and unique geometry/material/texture disposal.

- [ ] **Step 4: Document the binary asset contract**

Document meter scale, +Y up, +Z front, origin/pivot requirements, mesh names (`CMP_*`, `GEO_*`, `RGB_*`), Draco/Meshopt geometry, KTX2 textures, triangle budgets, and LOD suffixes. Keep placeholders active until an asset is explicitly marked available in the registry.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/three/models`

Expected: all model tests pass with one underlying load for concurrent callers.

Commit: `Build production model loading contracts`

---

### Task 3: Material, lighting, selection, raycast, and orbit systems

**Files:**
- Create: `src/three/materials/materialTokens.ts`
- Create: `src/three/materials/MetalMaterial.ts`
- Create: `src/three/materials/GlassMaterial.ts`
- Create: `src/three/materials/RGBMaterial.ts`
- Modify: `src/three/materials/MaterialSystem.ts`
- Modify: `src/three/core/LightingSystem.tsx`
- Create: `src/three/interaction/SelectionManager.ts`
- Create: `src/three/interaction/SelectionManager.test.ts`
- Create: `src/three/interaction/Raycaster.ts`
- Create: `src/three/interaction/Raycaster.test.ts`
- Create: `src/three/interaction/OrbitController.tsx`

**Interfaces:**
- Produces: metal, plastic, PCB, glass, and RGB material factories shared by GLB fallback and procedural models.
- Produces: `SelectionManager.select(slotId)`, `resolveRaycastSlot(intersections)`.
- Produces: `OrbitController` with left rotate, wheel dolly, right pan, damping, constrained target, and touch gestures.

- [ ] **Step 1: Write failing selection and raycast tests**

```ts
it("resolves the nearest selectable parent from a child mesh hit", () => {
  expect(resolveRaycastSlot([{ object: child, distance: 1 }])).toBe("gpu_slot");
});

it("emits only real selection changes", () => {
  manager.select("gpu_slot");
  manager.select("gpu_slot");
  expect(changes).toEqual(["gpu_slot"]);
});
```

- [ ] **Step 2: Confirm RED, then implement systems**

Run: `pnpm vitest run src/three/interaction/SelectionManager.test.ts src/three/interaction/Raycaster.test.ts`

Expected: FAIL because the new modules do not exist, followed by PASS after implementation.

- [ ] **Step 3: Preserve the V3 restraint in 3D**

Use neutral graphite metal, clear smoked glass, restrained blue key light, warm white fill, and a thin cyan rim. Do not add ambient Sparkles. Selection uses a short emissive edge response plus an HTML label; it never depends on color alone.

- [ ] **Step 4: Verify and commit**

Run: `pnpm vitest run src/three/interaction src/three/materials`

Expected: interaction and material tests pass.

Commit: `Add production interaction and material systems`

---

### Task 4: Modular PC scene and camera system

**Files:**
- Create: `src/three/pc/PartGroup.tsx`
- Create: `src/three/pc/PCCase.tsx`
- Create: `src/three/pc/Motherboard.tsx`
- Create: `src/three/pc/CPU.tsx`
- Create: `src/three/pc/GPU.tsx`
- Create: `src/three/pc/RAM.tsx`
- Create: `src/three/pc/Cooling.tsx`
- Create: `src/three/pc/Storage.tsx`
- Create: `src/three/pc/PowerSupply.tsx`
- Create: `src/three/pc/Fans.tsx`
- Create: `src/three/pc/PCScene.tsx`
- Create: `src/three/core/CameraSystem.tsx`
- Create: `src/three/animation/CameraAnimation.ts` (from Task 1 contract)
- Create: `src/three/viewer/BuilderPCViewer.tsx`
- Create: `src/three/viewer/BuilderPCViewer.module.css`

**Interfaces:**
- Consumes: selected Builder hardware, viewer mode, RGB settings, camera view, reduced-motion, quality tier.
- Produces: one Canvas containing independently mounted slot groups and an imperative camera command surface.

- [ ] **Step 1: Add a failing scene-selection adapter test**

Test that the Builder's eight selected categories resolve to the case, motherboard, CPU, GPU, RAM, storage, cooling, and PSU scene slots without reading the global legacy engine store.

- [ ] **Step 2: Implement slot-mounted procedural parts**

Reuse the proven procedural geometry factories as fallback objects, normalize each to slot-local origin, set `userData.slotId`, and render each through its own component. Add semantic object names and LOD to the GPU and repeated fans.

- [ ] **Step 3: Implement camera and Canvas runtime**

Use a transparent high-performance renderer, calibrated tone mapping, adaptive DPR, conditional shadows, a Suspense loader, WebGL fallback, context-loss status, OrbitControls, and GSAP camera interpolation. Build mode idles on demand; Airflow/RGB motion switches to continuous frames only while needed.

- [ ] **Step 4: Verify and commit**

Run: `pnpm vitest run src/three/pc src/three/animation/CameraAnimation.test.ts && pnpm typecheck`

Expected: tests and strict typecheck pass.

Commit: `Render the modular Builder PC scene`

---

### Task 5: Replacement and installation choreography

**Files:**
- Create: `src/three/animation/InstallAnimation.ts`
- Create: `src/three/animation/InstallAnimation.test.ts`
- Create: `src/three/pc/ReplaceablePart.tsx`
- Create: `src/three/pc/usePartReplacement.ts`
- Modify: `src/three/pc/CPU.tsx`
- Modify: `src/three/pc/GPU.tsx`
- Create: `src/three/pc/BuilderSceneSelection.ts`
- Create: `src/three/pc/BuilderSceneSelection.test.ts`

**Interfaces:**
- Produces: `InstallPhase`, `createInstallPlan(slot, durationMs)`, `playInstallAnimation(group, plan, callbacks)`.
- Produces: `usePartReplacement(nextHardware, slotId)` with latest-wins sequencing and cleanup.

- [ ] **Step 1: Write failing animation-plan and selection tests**

```ts
it("creates a 1200ms GPU installation with power3.out and all semantic phases", () => {
  const plan = createInstallPlan(getComponentSlot("gpu_slot"), 1200);
  expect(plan.phases.map((phase) => phase.name)).toEqual([
    "floating", "moving", "rotating", "inserting", "locked", "glowing",
  ]);
  expect(plan.ease).toBe("power3.out");
});
```

- [ ] **Step 2: Confirm RED, then implement replacement orchestration**

The rendered part holds the previous selection until removal finishes, swaps to the new descriptor, runs installation, exposes loading/phase progress to the HTML overlay, and cancels stale GSAP timelines on a newer selection or unmount. Reduced motion swaps immediately and retains textual status.

- [ ] **Step 3: Connect directly to the scoped Builder store**

`ThreeDViewport` subscribes to selected CPU/GPU and passes typed hardware to the scene. Selecting a HardwareItem already updates the Builder store; no second global hardware source is introduced.

- [ ] **Step 4: Verify and commit**

Run: `pnpm vitest run src/three/animation/InstallAnimation.test.ts src/three/pc/BuilderSceneSelection.test.ts src/features/builder`

Expected: animation plan, scene synchronization, and existing Builder tests pass.

Commit: `Synchronize Builder replacements with 3D installation`

---

### Task 6: Exploded, Airflow, and RGB Studio modes

**Files:**
- Create: `src/three/animation/ExplodedAnimation.ts`
- Create: `src/three/animation/ExplodedAnimation.test.ts`
- Create: `src/three/pc/ExplodedConnectors.tsx`
- Create: `src/three/pc/AirflowSystem.tsx`
- Create: `src/three/pc/RGBController.tsx`
- Create: `src/three/pc/rgbState.ts`
- Create: `src/three/pc/rgbState.test.ts`
- Modify: `src/three/pc/PCScene.tsx`
- Modify: `src/three/viewer/BuilderPCViewer.tsx`

**Interfaces:**
- Produces: exploded target transforms and connection-line endpoints.
- Produces: deterministic cold intake and warm exhaust point streams.
- Produces: `RGBSettings` with color, brightness, effect (`static | pulse | wave`), and speed.

- [ ] **Step 1: Write failing exploded/RGB pure-logic tests**

Test that GPU moves outward, cooling rises, RAM fans apart, PSU exits the lower bay, values clamp to supported RGB ranges, and reduced-motion settings resolve to a static effect.

- [ ] **Step 2: Implement Exploded mode**

Animate each slot from its assembled transform to its slot `explodedOffset`, switch the camera to the exploded preset, and draw quiet connection lines only after separation begins.

- [ ] **Step 3: Implement Airflow mode**

Render two deterministic point streams: blue intake through front/bottom fans and red exhaust through CPU/GPU to top/rear. Use one geometry per stream, adaptive counts, and no particles outside Airflow mode.

- [ ] **Step 4: Implement Studio mode**

Expose accessible controls for color, brightness, effect, and speed. Apply the same settings to `RGB_*` fan, GPU, and RAM meshes; continuous rendering is enabled only for pulse/wave.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/three/animation/ExplodedAnimation.test.ts src/three/pc/rgbState.test.ts && pnpm typecheck`

Expected: mode logic and strict typecheck pass.

Commit: `Add exploded airflow and RGB Studio modes`

---

### Task 7: Replace the V3 viewport placeholder with the production viewer

**Files:**
- Modify: `src/features/builder/viewport/ThreeDViewport.tsx`
- Modify: `src/features/builder/viewport/ThreeDViewport.module.css`
- Modify: `src/features/builder/viewport/ThreeDViewport.test.tsx`
- Modify: `src/features/builder/viewport/ViewportLoader.tsx`
- Modify: `src/app/builder/BuilderRouteBoundary.test.ts`

**Interfaces:**
- Consumes: `BuilderPCViewer` and `useBuilderWorkspaceStore`.
- Produces: accessible mode switch, camera reset/detail/fullscreen controls, loader/error/status overlays, selected-part status, and responsive RGB Studio controls.

- [ ] **Step 1: Rewrite viewport tests first**

Mock only the WebGL leaf and assert that mode selection reaches it, Studio controls change RGB settings, camera actions emit the correct command, loading geometry is preserved, and the obsolete placeholder copy is absent.

- [ ] **Step 2: Run and confirm RED**

Run: `pnpm vitest run src/features/builder/viewport/ThreeDViewport.test.tsx`

Expected: FAIL because the current placeholder neither mounts the viewer nor exposes real controls.

- [ ] **Step 3: Implement the real viewport shell**

Preserve the 720px stage hierarchy. Overlay only task controls: mode switch, selected component/status, reset/detail/fullscreen, interaction hint, loader/progress/error, and Studio controls. Keep all buttons keyboard accessible and at least 44px on touch layouts.

- [ ] **Step 4: Verify the Builder boundary and commit**

Run: `pnpm vitest run src/features/builder src/app/builder/BuilderRouteBoundary.test.ts && pnpm typecheck`

Expected: Builder tests pass and the workspace still imports Three.js only through the dynamically loaded viewport leaf.

Commit: `Integrate the production 3D viewer into Builder`

---

### Task 8: Performance, browser QA, documentation, and release

**Files:**
- Modify: `README.md`
- Modify: `DESIGN.md`
- Create: `.qa/three-engine-v2/*` (ignored evidence only)

**Interfaces:**
- Produces: verified Engine V2.0 release branch and tag.

- [ ] **Step 1: Run static and automated gates**

Run: `pnpm lint`

Run: `pnpm typecheck`

Run: `pnpm test:run`

Run: `pnpm build`

Run: `pnpm doctor`

Expected: zero lint/type/build errors, all tests pass, and React Doctor reports no diagnostics.

- [ ] **Step 2: Run production browser scenarios**

Start `pnpm start` from a fresh production build and capture `/builder` at 1440×1024, 1024×768, and 390×844. Exercise orbit, wheel zoom, right-drag pan, touch-size mode buttons, GPU replacement, CPU replacement, camera reset/detail, Exploded, Airflow, Studio color/brightness/effect/speed, fullscreen availability, keyboard focus, and reduced-motion behavior.

- [ ] **Step 3: Inspect performance and cleanup**

Record renderer DPR/quality state, browser console errors, layout overflow, and steady interaction feel. Confirm no ambient particle loop in Build mode, no duplicate model fetch, and no retained stale GSAP timeline after replacement. Stop the production server and keep only ignored QA artifacts.

- [ ] **Step 4: Run final diff and file-size review**

Measure every changed TypeScript file for the 250 pure LOC ceiling, inspect the full diff, verify design-token compliance, and re-run the complete `pnpm verify` command after all visual fixes.

- [ ] **Step 5: Release through Git**

Commit final QA/docs fixes, push `codex/three-engine-v2`, create tag `pc-lab-three-engine-v2.0.0`, and push the tag to `git@github.com:TONGTONG7720/computer-3d.git`.

Expected: clean worktree, remote branch and tag present, no marketplace/AI/community changes.

