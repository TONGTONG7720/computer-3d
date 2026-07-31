# PC LAB 3D Builder System V1.0 — Implementation Plan

## Milestone 1 — Typed domain

- Add discriminated hardware types and a complete mock catalogue.
- Add price, power, compatibility, performance and recommendation tests first.
- Implement the minimum pure calculators required by those tests.
- Add local-storage schemas and repository functions.

## Milestone 2 — State and scene synchronization

- Add a vanilla Zustand builder store with a React selector hook.
- Derive totals and feedback after every selection.
- Generalize replacement slots from CPU/GPU to every configurable scene component.
- Resolve builder hardware manifests in `PCScene` and retain procedural fallbacks.

## Milestone 3 — Product surface

- Add Framer Motion.
- Replace the old CPU/GPU rail with the eight-category `ComponentSelector`.
- Replace engine telemetry with `BuildSummary`.
- Add recommendation and save dialogs plus animated price/score deltas.
- Preserve all Engine V1.0 viewport tools and status feedback.

## Milestone 4 — Verification and publication

- Run focused domain tests during implementation.
- Run lint, typecheck, complete tests and production build.
- Exercise desktop and mobile selection, recommendation, save and 3D replacement.
- Commit atomic milestones, push the feature branch, merge to `main`, and publish
  tag `builder-v1.0.0`.

