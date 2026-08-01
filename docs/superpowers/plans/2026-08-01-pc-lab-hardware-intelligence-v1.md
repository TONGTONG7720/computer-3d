# PC LAB 3D Hardware Intelligence V1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MySQL-backed hardware, authoritative compatibility/performance/budget analysis, deterministic optimization, Hardware Explorer, and Hardware CMS work end to end with the existing V3 Builder and Three Engine V2.0.

**Architecture:** The existing hardware/specification/model/price schema remains the source of truth and receives a V6 intelligence migration. Pure Java engines operate on typed hardware facts assembled from persisted records; REST controllers expose query, analysis, optimization, and rule administration. Next.js parses every response with Zod, bootstraps the scoped Builder from the API, reconciles only the latest analysis revision, and adds token-driven Explorer/Admin surfaces without changing the Three.js selection contract.

**Tech Stack:** MySQL 8, Redis, Spring Boot 3.5, Java 21, MyBatis Plus 3.5, Flyway, Next.js 16, React 19, TypeScript 6, Zustand 5, Zod 4, Ky 2, CSS Modules, JUnit 5, MockMvc, Vitest 4, Biome 2.

## Global Constraints

- Build from `pc-lab-three-engine-v2.0.0`; do not regress the modular 3D engine or introduce a second selection store.
- Preserve existing hardware, specification, internal price, model, Price Intelligence, and AI data; V6 is additive and reversible through normal database backup/restore rather than destructive migration.
- MySQL and Redis credentials remain environment variables and no local password is committed.
- No marketplace adapters, crawler, community, account system, or AI chat changes.
- Spring Boot is authoritative for compatibility, performance, budget, and optimization; local calculations exist only for responsive interim feedback.
- Frontend applies an analysis response only when its revision equals the current Builder revision.
- New TypeScript boundaries use Zod; properties are readonly; no `any`, enum, non-null assertion, ignore directive, or raw fetch.
- New TypeScript production files stay below 250 pure LOC and UI consumes existing `DESIGN.md` semantic tokens.
- Every behavioral task follows RED, observed failure, GREEN, refactor, targeted verification, and an atomic commit.

---

### Task 1: V6 intelligence schema and seed contract

**Files:**
- Create: `backend/src/main/resources/db/migration/V6__create_hardware_intelligence.sql`
- Create: `backend/src/test/java/com/pclab/hardware/intelligence/database/HardwareIntelligenceMigrationContractTest.java`

**Interfaces:**
- Produces: `hardware_performance_data`, `compatibility_rule`, missing specification/model columns, indexes, constraints, reviewed profiles, and eight enabled rule rows.

- [ ] **Step 1: Write the migration contract test first**

Read the migration text and assert the exact tables/columns, unique/index names, score checks, rule types, and required seed hardware/profile/rule identifiers. Include a test proving V1/V2 records are updated rather than duplicated.

- [ ] **Step 2: Confirm RED**

Run: `mvn -f backend/pom.xml -Dtest=HardwareIntelligenceMigrationContractTest test`

Expected: FAIL because V6 does not exist.

- [ ] **Step 3: Add the additive migration**

Add `popularity_score`, CPU generation, GPU interface/resolutions, motherboard chipset, PSU connectors, model animation JSON, the performance table, and the versioned compatibility-rule table. Seed reviewed profiles for every V2 record and the eight rule definitions.

- [ ] **Step 4: Verify and commit**

Run: `mvn -f backend/pom.xml -Dtest=HardwareIntelligenceMigrationContractTest,SeedDataContractTest test`

Commit: `Extend the hardware intelligence schema`

---

### Task 2: Typed hardware facts and performance persistence

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/IntelligenceCategory.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/ComponentSpecification.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/HardwareFacts.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/PerformanceProfile.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/entity/HardwarePerformanceEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/mapper/HardwarePerformanceMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/service/HardwareFactsAssembler.java`
- Modify: relevant specification entities and `HardwareModelEntity.java`
- Modify: `backend/src/main/java/com/pclab/hardware/vo/HardwareView.java`
- Modify: `backend/src/main/java/com/pclab/hardware/service/HardwareViewAssembler.java`
- Create: `backend/src/test/java/com/pclab/hardware/intelligence/service/HardwareFactsAssemblerTest.java`

**Interfaces:**
- Produces: sealed category specifications and `HardwareFactsAssembler.from(HardwareView)`.
- Produces: `HardwareView.performanceProfile`, popularity, extended specification, and primary model metadata.

- [ ] **Step 1: Write failing assembler tests**

Given CPU/GPU/motherboard views with reviewed profiles, assert exact typed specification variants and preserve IDs, prices, power, and model metadata.

- [ ] **Step 2: Confirm RED, implement minimum typed mapping, then refactor**

Run: `mvn -f backend/pom.xml -Dtest=HardwareFactsAssemblerTest test`

Use a sealed `ComponentSpecification` hierarchy and exhaustive Java 21 switch. No untyped JSON crosses into engine code.

- [ ] **Step 3: Extend list/detail assembly and verify**

Run: `mvn -f backend/pom.xml -Dtest=HardwareFactsAssemblerTest,HardwareViewAssemblerTest,HardwareControllerTest test`

Commit: `Build typed hardware intelligence facts`

---

### Task 3: Compatibility, performance, and budget engines

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/BuildSelection.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/CompatibilityReport.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/PerformanceReport.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/domain/BudgetReport.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/entity/CompatibilityRuleEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/mapper/CompatibilityRuleMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/engine/CompatibilityEngine.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/engine/PerformanceEngine.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/engine/BudgetEngine.java`
- Test: corresponding tests under `backend/src/test/java/com/pclab/hardware/intelligence/engine/`

**Interfaces:**
- Produces: `CompatibilityEngine.evaluate(selection, rules)`, `PerformanceEngine.calculate(selection)`, and `BudgetEngine.calculate(limit, current)`.

- [ ] **Step 1: RED each rule independently**

Tests cover socket, DDR generation, GPU clearance, cooler TDP/socket, motherboard/radiator fit, raw PSU failure, 20% headroom warning, and partial-selection `INCOMPLETE`.

Run: `mvn -f backend/pom.xml -Dtest=CompatibilityEngineTest test`

- [ ] **Step 2: Implement exhaustive compatibility dispatch**

Rules execute in priority order and return structured expected/actual evidence. Recommended PSU rounds to the next 50W after 75W reserve and 20% headroom.

- [ ] **Step 3: RED/GREEN performance and budget calculations**

Run: `mvn -f backend/pom.xml -Dtest=PerformanceEngineTest,BudgetEngineTest test`

Assert the approved 30/50/10/10, 40/30/15/15, and 20/60/15/5 weights plus WITHIN/NEAR_LIMIT/OVER thresholds.

- [ ] **Step 4: Verify and commit**

Run: `mvn -f backend/pom.xml -Dtest='com.pclab.hardware.intelligence.engine.*Test' test`

Commit: `Implement hardware analysis engines`

---

### Task 4: Build analysis and deterministic optimizer API

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/dto/BuildComponentIds.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/dto/BuildAnalysisRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/dto/BuildOptimizationRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/dto/CompatibilityCheckQuery.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/vo/BuildAnalysisView.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/vo/BuildOptimizationView.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/service/HardwareIntelligenceCatalogue.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/service/BuildAnalysisService.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/engine/BuildOptimizer.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/controller/BuildIntelligenceController.java`
- Modify: `backend/src/main/java/com/pclab/hardware/controller/BuildController.java`
- Test: optimizer/service/controller tests.

**Interfaces:**
- Produces: `GET /api/compatibility/check`, `POST /api/build/analyze`, and `POST /api/build/optimize`.

- [ ] **Step 1: Write failing optimizer tests**

Given a flagship CPU/GPU plus 16GB RAM, require a 32GB suggestion. Given an over-budget build,
require deterministic cheaper replacements, preserved gaming GPU when feasible, and an explicit
unresolved shortfall when no catalogue solution exists.

- [ ] **Step 2: Implement the optimizer and analysis orchestrator**

Use compatible one-step/group repairs followed by score-retention-per-yuan budget reductions. Never mutate the input selection.

- [ ] **Step 3: Write MockMvc contracts before controllers**

Assert revision echo, structured reports, invalid budget rejection, unknown hardware error, and optimizer response shape.

- [ ] **Step 4: Verify and commit**

Run: `mvn -f backend/pom.xml -Dtest=BuildOptimizerTest,BuildAnalysisServiceTest,BuildIntelligenceControllerTest test`

Commit: `Expose build intelligence APIs`

---

### Task 5: Hardware search extensions and rule administration

**Files:**
- Modify: `backend/src/main/java/com/pclab/hardware/dto/HardwareQuery.java`
- Modify: `backend/src/main/java/com/pclab/hardware/service/HardwareQueryService.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/dto/CompatibilityRuleMutationRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/dto/HardwarePerformanceUpdateRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/vo/CompatibilityRuleView.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/service/AdminIntelligenceService.java`
- Create: `backend/src/main/java/com/pclab/hardware/intelligence/controller/AdminIntelligenceController.java`
- Test: query and admin controller/service tests.

**Interfaces:**
- Extends `GET /api/hardware` with `maxPower` and `popularity_desc`.
- Produces performance update and versioned compatibility-rule list/create/update endpoints.

- [ ] **Step 1: Add failing query and admin tests**

Verify maximum power filtering, popularity ordering, validation, Admin Key enforcement, optimistic conflicts, and cache eviction.

- [ ] **Step 2: Implement search/admin behavior and verify**

Run: `mvn -f backend/pom.xml -Dtest=HardwareControllerTest,AdminIntelligenceControllerTest,AdminIntelligenceServiceTest test`

- [ ] **Step 3: Run the complete backend suite and commit**

Run: `mvn -f backend/pom.xml test`

Commit: `Complete hardware search and intelligence admin APIs`

---

### Task 6: Real Builder catalogue and analysis synchronization

**Files:**
- Modify: `src/features/builder/api/HardwareApiClient.ts`
- Create: `src/features/builder/api/BuildIntelligenceApiClient.ts`
- Create: `src/features/builder/domain/intelligence.ts`
- Modify: `src/store/builderStore.ts`
- Modify: `src/features/builder/store/BuilderStoreProvider.tsx`
- Create: `src/features/builder/store/BuilderDataSync.tsx`
- Modify: `src/features/builder/workspace/BuilderWorkspace.tsx`
- Modify: `src/features/hardware/HardwareLibrary.tsx`
- Test: API parser, store revision, provider/bootstrap, and library-state tests.

**Interfaces:**
- Produces: Zod-parsed catalogue/page/analysis/optimization contracts.
- Produces: budget, analysis revision/status, budget report, server reconciliation, and stale-result rejection in the scoped store.

- [ ] **Step 1: Write failing API and store tests**

Assert enriched hardware parsing, empty-provider bootstrap, loader/error/retry state, revision increment, stale response rejection, and authoritative latest response application.

- [ ] **Step 2: Confirm RED and remove runtime mock initialization**

Mocks remain test fixtures only. `BuilderDataSync` initializes catalogue once and analyses complete selections with an abortable Ky request.

- [ ] **Step 3: Verify and commit**

Run: `pnpm vitest run src/features/builder src/features/hardware src/store/builderStore.test.ts && pnpm typecheck`

Commit: `Connect Builder to hardware intelligence APIs`

---

### Task 7: Budget and optimization Builder experience

**Files:**
- Modify: `src/features/build/BuilderToolbar.tsx`
- Modify: `src/features/build/BuilderToolbar.module.css`
- Modify: `src/features/build/BuildPanel.tsx`
- Modify: `src/features/build/PriceCard.tsx`
- Modify: `src/features/build/AnalysisCards.module.css`
- Create: `src/features/build/OptimizationPanel.tsx`
- Modify: `src/features/build/BuildPanel.module.css`
- Test: Toolbar, BuildPanel, PriceCard, and OptimizationPanel tests.

**Interfaces:**
- Produces: editable non-negative budget, remaining/overage status, server freshness, explicit optimize/apply flow, and accessible loading/error recovery.

- [ ] **Step 1: Write failing interaction tests**

Test budget editing, over-budget text, optimization request, suggestion explanation, apply action resolving IDs from the catalogue, and no silent mutation.

- [ ] **Step 2: Implement against V3.7 tokens and states**

Use Lucide icons, native labelled controls, 44px touch targets, tabular numbers, explicit internal-price provenance, and reduced-motion-safe feedback.

- [ ] **Step 3: Verify and commit**

Run: `pnpm vitest run src/features/build src/features/builder/workspace && pnpm typecheck`

Commit: `Add budget control and deterministic optimization UI`

---

### Task 8: Hardware Explorer and Hardware CMS

**Files:**
- Create: `src/app/hardware/page.tsx`
- Create: `src/features/hardware/explorer/HardwareExplorer.tsx`
- Create: `src/features/hardware/explorer/HardwareExplorer.module.css`
- Create: focused Explorer filter/result/API modules and tests under the same directory.
- Create: `src/app/admin/hardware/page.tsx`
- Create: focused Admin access, catalogue, model, rule, API, and CSS modules under `src/features/hardware/admin/`.
- Modify: `src/app/layout.tsx` metadata only if route titles require it.

**Interfaces:**
- Produces: URL-backed technical search/filter/sort and `在 Builder 中使用` handoff.
- Produces: session-scoped Admin Key workspace for catalogue, model, performance, and compatibility-rule operations.

- [ ] **Step 1: Write failing Explorer and Admin tests**

Cover loading, result, empty, error/retry, URL restoration, filter query construction, model readiness, Admin Key isolation, rule version conflict, and keyboard tab changes.

- [ ] **Step 2: Implement reusable primitives before route composition**

Use existing V3 tokens and CSS Modules. Preserve technical density; no commerce ratings, sale badges, gradient cards, generic KPI tile wall, or decorative motion.

- [ ] **Step 3: Verify and commit**

Run: `pnpm vitest run src/features/hardware src/app/hardware src/app/admin/hardware && pnpm typecheck`

Commit: `Build Hardware Explorer and Hardware CMS`

---

### Task 9: End-to-end verification, documentation, and release

**Files:**
- Modify: `README.md`
- Modify: `.env.example` and `backend/.env.example` only for non-secret configuration keys.
- Create: ignored evidence under `.qa/hardware-intelligence-v1/`.

**Interfaces:**
- Produces: verified `codex/hardware-intelligence-v1` branch and `pc-lab-hardware-intelligence-v1.0.0` tag.

- [ ] **Step 1: Verify database and API runtime**

Start MySQL/Redis-backed Spring Boot with credentials supplied through process environment, confirm Flyway V6, and exercise list/detail/check/analyse/optimize/admin-rule endpoints including one failure path.

- [ ] **Step 2: Run complete static and automated gates**

Run: `mvn -f backend/pom.xml test`

Run: `pnpm verify`

Run: `pnpm doctor`

Expected: Maven, Biome, TypeScript, Vitest, and Next production build pass. Any React Doctor findings are fixed or explicitly proven pre-existing and out of scope.

- [ ] **Step 3: Run real-browser QA**

Drive production `/builder`, `/hardware`, and `/admin/hardware` at 1280, 768, and 375 widths. Exercise API loading/error recovery, hardware search/filter/sort, selection-to-3D replacement, incompatible selection, budget overage, optimizer proposal/apply, Admin navigation, keyboard focus, 200% zoom, and reduced motion. Capture screenshots and console/layout evidence.

- [ ] **Step 4: Review architecture and changed-file health**

Run the TypeScript no-excuse checker, measure changed TypeScript pure LOC, scan raw visual tokens, inspect full diff, run `git diff --check`, and rerun `pnpm verify` plus Maven tests after the final repair.

- [ ] **Step 5: Release through Git**

Push every atomic commit to `origin/codex/hardware-intelligence-v1`, create annotated tag `pc-lab-hardware-intelligence-v1.0.0`, push it, and verify both refs with `git ls-remote`. Stop before Price Ecosystem work.
