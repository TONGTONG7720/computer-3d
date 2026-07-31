# PC LAB 3D AI Builder V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a rules-first, explainable AI PC advisor that can optionally use an OpenAI-compatible model and Chroma retrieval, persists verified builds, drives the existing Three.js replacement queue, and provides an Admin AI operations console.

**Architecture:** A Spring Boot orchestration boundary parses intent, retrieves reviewed knowledge, enumerates compatible catalogue combinations, persists the winning BuildConfig and returns only verified component keys. Next.js parses the response with Zod, resolves keys against the live catalogue and applies the selection through `BuilderEngineSync`. External model/vector calls are conditional and fall back to local deterministic behaviour.

**Tech Stack:** Java 21, Spring Boot 3.5, MyBatis Plus, MySQL 8, Redis, Flyway, Spring `RestClient`, Next.js 16, React 19, TypeScript strict mode, Zod 4, Zustand 5, CSS Modules, Vitest.

## Global Constraints

- Do not add Community, accounts, marketplace crawling or checkout.
- The default installation must work without an AI key or Chroma service.
- LLM output never selects hardware; the server-side solver is authoritative.
- Raw user messages are not stored in `ai_request_log`.
- All external payloads are parsed at their boundary; no untyped maps cross into domain logic.
- New source modules remain at or below 250 non-blank, non-comment lines.
- Every behaviour starts with a failing test and follows RED → GREEN → REFACTOR.
- Every completed vertical slice is committed and pushed to `origin/codex/ai-builder-v1`.
- `.omo/` remains local evidence and is never staged.

---

## File map

### Backend

- `backend/src/main/resources/db/migration/V5__create_ai_builder.sql`: AI prompts, knowledge, rules and privacy-minimised logs.
- `backend/src/main/java/com/pclab/hardware/ai/domain/*`: immutable intent, route, evidence and proposal types.
- `backend/src/main/java/com/pclab/hardware/ai/parser/RuleRequirementParser.java`: deterministic Chinese/English intent extraction.
- `backend/src/main/java/com/pclab/hardware/ai/recommendation/*`: catalogue enumeration, hard compatibility, purpose scoring and optimisation.
- `backend/src/main/java/com/pclab/hardware/ai/rag/*`: MySQL lexical retrieval, optional Chroma vector store and fallback coordination.
- `backend/src/main/java/com/pclab/hardware/ai/model/*`: cost router, OpenAI-compatible chat/embedding clients and disabled defaults.
- `backend/src/main/java/com/pclab/hardware/ai/service/*`: orchestration, explanations, audit and Admin operations.
- `backend/src/main/java/com/pclab/hardware/ai/controller/*`: public and protected REST routes.
- `backend/src/main/java/com/pclab/hardware/ai/{entity,mapper,dto,vo,config}/*`: persistence and typed boundary contracts.

### Frontend

- `src/features/ai/domain/ai.ts`: Zod response schemas and branded IDs.
- `src/features/ai/domain/resolveAiSelection.ts`: catalogue-key to complete selection conversion.
- `src/features/ai/api/AiApiClient.ts`: public build call.
- `src/features/ai/api/AdminAiApiClient.ts`: Admin operations calls.
- `src/features/ai/assistant/*`: launcher, dialog, transcript, proposal, composer and controller hook.
- `src/features/ai/admin/*`: overview, prompt, knowledge, rule and log workspaces.
- `src/app/admin/ai/page.tsx`: AI operations route.
- `src/features/engine/EngineDemo.tsx`: mounts the assistant leaf.

---

### Task 1: AI schema, domain and deterministic requirement parser

**Files:**
- Create: `backend/src/main/resources/db/migration/V5__create_ai_builder.sql`
- Create: `backend/src/main/java/com/pclab/hardware/ai/domain/AiRequirement.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/domain/AiRoute.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/parser/RuleRequirementParser.java`
- Create: `backend/src/test/java/com/pclab/hardware/ai/database/AiMigrationContractTest.java`
- Create: `backend/src/test/java/com/pclab/hardware/ai/parser/RuleRequirementParserTest.java`

**Interfaces:**
- Produces: `AiRequirement RuleRequirementParser.parse(String message)`.
- `AiRequirement` carries budget, purpose set, priorities, styles, form factor, requested hardware text, confidence and missing information.

- [ ] **Step 1: Write migration and parser contract tests**

```java
@Test
void parsesGamingBudgetAndPreferences_whenChineseRequestIsComplete() {
    AiRequirement result = parser.parse("8000预算玩3A，希望白色RGB并且安静");
    assertThat(result.budget()).isEqualByComparingTo("8000");
    assertThat(result.purposes()).containsExactly(Purpose.GAMING);
    assertThat(result.styles()).contains(Style.WHITE, Style.RGB);
    assertThat(result.priorities()).contains(Priority.QUIET);
}
```

- [ ] **Step 2: Run RED**

Run: `mvn -f backend/pom.xml -Dtest=AiMigrationContractTest,RuleRequirementParserTest test`

Expected: compilation failure because the AI migration and domain parser do not exist.

- [ ] **Step 3: Implement the migration and minimum parser**

Use enum-backed immutable records, explicit budget bounds and ordered regex/keyword rules. The migration seeds the active intent system prompt, compatibility/workload knowledge and purpose weight rules.

- [ ] **Step 4: Run GREEN and migration syntax checks**

Run: `mvn -f backend/pom.xml -Dtest=AiMigrationContractTest,RuleRequirementParserTest test`

Expected: all Task 1 tests pass.

- [ ] **Step 5: Commit and push**

```powershell
git add -- backend/src/main/resources/db/migration/V5__create_ai_builder.sql backend/src/main/java/com/pclab/hardware/ai backend/src/test/java/com/pclab/hardware/ai
git commit -m "Create AI Builder knowledge foundation"
git push
```

### Task 2: Compatible build solver and explainable optimisation

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/ai/recommendation/AiBuildCandidate.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/recommendation/AiBuildSolver.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/recommendation/AiCandidateScorer.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/recommendation/AiBuildExplanation.java`
- Create: `backend/src/test/java/com/pclab/hardware/ai/recommendation/AiBuildSolverTest.java`
- Create: `backend/src/test/java/com/pclab/hardware/ai/recommendation/AiCandidateScorerTest.java`

**Interfaces:**
- Consumes: `AiRequirement`, `List<HardwareView>` and optional current component keys.
- Produces: `AiBuildCandidate solve(AiRecommendationInput input)` with complete components, metrics, alternatives, deltas and unfulfilled preferences.

- [ ] **Step 1: Write failing compatibility, budget and optimisation tests**

```java
@Test
void protectsGpuBudget_whenGamingBuildMustBeReduced() {
    AiBuildCandidate result = solver.solve(gamingInputWithBudget("8000"));
    assertThat(result.metrics().compatibilityStatus()).isNotEqualTo("ERROR");
    assertThat(result.totalPrice()).isLessThanOrEqualTo(new BigDecimal("8000"));
    assertThat(result.components().get("gpu").id()).isEqualTo("gpu-nvidia-rtx5070");
}
```

- [ ] **Step 2: Run RED**

Run: `mvn -f backend/pom.xml -Dtest=AiBuildSolverTest,AiCandidateScorerTest test`

Expected: compilation failure for the missing solver.

- [ ] **Step 3: Implement minimum exhaustive solver**

Enumerate one active option per required category, reuse `BuildMetricsCalculator`, reject `ERROR`, then sort by budget fit, purpose score, preference score and price. Keep scoring weights in one typed table.

- [ ] **Step 4: Add modification dependency test**

Prove that requesting RTX 5090 also selects a PSU/case combination that remains compatible, and that `changedDependencies` names those automatic changes.

- [ ] **Step 5: Run GREEN**

Run: `mvn -f backend/pom.xml -Dtest=AiBuildSolverTest,AiCandidateScorerTest test`

- [ ] **Step 6: Commit and push**

```powershell
git add -- backend/src/main/java/com/pclab/hardware/ai/recommendation backend/src/test/java/com/pclab/hardware/ai/recommendation
git commit -m "Add explainable AI build solver"
git push
```

### Task 3: RAG retrieval, Chroma and model cost routing

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/ai/entity/AiKnowledgeDocumentEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/mapper/AiKnowledgeDocumentMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/rag/KnowledgeRetriever.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/rag/MySqlKnowledgeRetriever.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/rag/ChromaVectorStore.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/rag/HybridKnowledgeRetriever.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/model/AiIntentModelGateway.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/model/OpenAiCompatibleIntentGateway.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/model/OpenAiEmbeddingClient.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/model/AiCostRouter.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/config/AiProperties.java`
- Modify: `backend/src/main/java/com/pclab/hardware/config/WebConfig.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application-test.yml`
- Test: `backend/src/test/java/com/pclab/hardware/ai/rag/HybridKnowledgeRetrieverTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/ai/model/AiCostRouterTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/ai/model/OpenAiCompatibleIntentGatewayTest.java`

**Interfaces:**
- `List<AiKnowledgeEvidence> KnowledgeRetriever.retrieve(AiRetrievalQuery query)`.
- `Optional<AiRequirement> AiIntentModelGateway.parse(AiModelInput input)`.
- `AiRoute AiCostRouter.route(AiRouteInput input)`.

- [ ] **Step 1: Write failing fallback and route tests**

Assert exact requests use `RULE`, ambiguous narratives use `LLM` only when enabled/quota is available, invalid model JSON falls back, and Chroma failures return deterministic MySQL evidence.

- [ ] **Step 2: Run RED**

Run: `mvn -f backend/pom.xml -Dtest=HybridKnowledgeRetrieverTest,AiCostRouterTest,OpenAiCompatibleIntentGatewayTest test`

- [ ] **Step 3: Implement local retrieval and conditional clients**

Use bounded `RestClient` timeouts, configured Chroma V2 collection endpoints and OpenAI-compatible chat/embedding endpoints. External errors are converted to typed availability results; secret values never enter exception messages.

- [ ] **Step 4: Run GREEN**

Run: `mvn -f backend/pom.xml -Dtest=HybridKnowledgeRetrieverTest,AiCostRouterTest,OpenAiCompatibleIntentGatewayTest test`

- [ ] **Step 5: Commit and push**

```powershell
git add -- backend/src/main/java/com/pclab/hardware/ai backend/src/main/java/com/pclab/hardware/config/WebConfig.java backend/src/main/resources backend/src/test
git commit -m "Add resilient AI retrieval and model routing"
git push
```

### Task 4: Public AI orchestration and BuildConfig persistence

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/ai/dto/AiBuildRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/vo/AiBuildView.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/entity/AiRequestLogEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/mapper/AiRequestLogMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/service/AiCatalogueService.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/service/AiAuditService.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/service/AiBuildService.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/controller/AiBuildController.java`
- Modify: `backend/src/main/java/com/pclab/hardware/exception/ErrorCode.java`
- Test: `backend/src/test/java/com/pclab/hardware/ai/service/AiBuildServiceTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/ai/controller/AiBuildControllerTest.java`

**Interfaces:**
- `AiBuildView AiBuildService.build(AiBuildRequest request)`.
- Public contract: `POST /api/ai/build` returns the standard `ApiResponse<AiBuildView>` envelope.

- [ ] **Step 1: Write failing end-to-end service and HTTP contract tests**

The service test uses a real parser and solver with an in-memory catalogue fake; the controller test asserts validation, response fields and typed error envelope.

- [ ] **Step 2: Run RED**

Run: `mvn -f backend/pom.xml -Dtest=AiBuildServiceTest,AiBuildControllerTest test`

- [ ] **Step 3: Implement orchestration**

Parse intent, retrieve evidence, solve, save through `BuildConfigService`, compose factual explanations and write the privacy-minimised audit record in one request flow. Generate a session UUID when absent.

- [ ] **Step 4: Run GREEN and full backend tests**

Run: `mvn -f backend/pom.xml test`

- [ ] **Step 5: Commit and push**

```powershell
git add -- backend/src/main/java/com/pclab/hardware/ai backend/src/main/java/com/pclab/hardware/exception/ErrorCode.java backend/src/test
git commit -m "Expose AI build orchestration API"
git push
```

### Task 5: Protected AI operations API

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/ai/entity/AiPromptConfigEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/entity/AiRecommendationRuleEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/mapper/AiPromptConfigMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/mapper/AiRecommendationRuleMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/dto/AdminAiRequests.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/vo/AdminAiViews.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/service/AdminAiService.java`
- Create: `backend/src/main/java/com/pclab/hardware/ai/controller/AdminAiController.java`
- Test: `backend/src/test/java/com/pclab/hardware/ai/service/AdminAiServiceTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/ai/controller/AdminAiControllerTest.java`

**Interfaces:**
- Produces the Admin routes listed in the design specification with optimistic versions and archive semantics.

- [ ] **Step 1: Write failing Admin service/controller tests**

Test prompt publication, knowledge vector sync state, rule version conflicts and privacy-safe log pagination.

- [ ] **Step 2: Run RED**

Run: `mvn -f backend/pom.xml -Dtest=AdminAiServiceTest,AdminAiControllerTest test`

- [ ] **Step 3: Implement minimum Admin operations**

Reuse the existing Admin interceptor and envelope. Never physically delete knowledge; update status to `ARCHIVED`. Return new versions after every successful update.

- [ ] **Step 4: Run GREEN**

Run: `mvn -f backend/pom.xml test`

- [ ] **Step 5: Commit and push**

```powershell
git add -- backend/src/main/java/com/pclab/hardware/ai backend/src/test/java/com/pclab/hardware/ai
git commit -m "Add AI operations administration API"
git push
```

### Task 6: Frontend AI contracts and Builder synchronisation

**Files:**
- Create: `src/features/ai/domain/ai.ts`
- Create: `src/features/ai/domain/resolveAiSelection.ts`
- Create: `src/features/ai/domain/resolveAiSelection.test.ts`
- Create: `src/features/ai/api/AiApiClient.ts`
- Create: `src/features/ai/api/AiApiClient.test.ts`
- Create: `src/features/ai/assistant/useAiAssistant.ts`
- Create: `src/features/ai/assistant/useAiAssistant.test.tsx`

**Interfaces:**
- `requestAiBuild(input, client): Promise<AiBuildResponse>` parses the envelope with Zod.
- `resolveAiSelection(components, catalogue): SelectedComponents` rejects missing or category-mismatched keys.
- `useAiAssistant` applies initial compatible proposals through `applyBuilderSelectionWithScene` and holds multi-part changes for confirmation.

- [ ] **Step 1: Write failing parsing, resolution and state-flow tests**

```typescript
it("applies a complete compatible proposal through the scene sync", async () => {
  // Given a ready catalogue and a successful AI response
  // When the request resolves
  // Then every returned key is selected and scene replacement is queued
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm vitest run src/features/ai`

- [ ] **Step 3: Implement schemas, client and controller hook**

Keep API values readonly, brand request/session/config IDs, and represent assistant state as an exhaustive discriminated union.

- [ ] **Step 4: Run GREEN, typecheck and lint**

Run: `pnpm vitest run src/features/ai && pnpm typecheck && pnpm lint`

- [ ] **Step 5: Commit and push**

```powershell
git add -- src/features/ai
git commit -m "Connect AI proposals to Builder state"
git push
```

### Task 7: AI diagnostic-port assistant UI

**Files:**
- Create: `src/features/ai/assistant/AiAssistant.tsx`
- Create: `src/features/ai/assistant/AiAssistant.module.css`
- Create: `src/features/ai/assistant/AiTranscript.tsx`
- Create: `src/features/ai/assistant/AiBuildProposal.tsx`
- Create: `src/features/ai/assistant/AiComposer.tsx`
- Create: `src/features/ai/assistant/AiAssistant.test.tsx`
- Modify: `src/features/engine/EngineDemo.tsx`

**Interfaces:**
- `AiAssistant` is a client leaf with no direct Three.js imports.
- Reuses `useDialogFocus` for focus isolation and restoration.

- [ ] **Step 1: Write failing interaction tests**

Test launcher semantics, quick prompt submission, Enter/Shift+Enter, loading state, proposal confirmation, Escape close, focus restoration and offline recovery.

- [ ] **Step 2: Run RED**

Run: `pnpm vitest run src/features/ai/assistant`

- [ ] **Step 3: Implement primitives and visual states**

Use only `DESIGN.md` tokens, Lucide icons, existing glass-depth recipe and transform/opacity motion. Keep the 3D computer visually dominant.

- [ ] **Step 4: Run GREEN and static gates**

Run: `pnpm vitest run src/features/ai/assistant && pnpm typecheck && pnpm lint`

- [ ] **Step 5: Commit and push**

```powershell
git add -- src/features/ai/assistant src/features/engine/EngineDemo.tsx
git commit -m "Add AI build advisor to the 3D Builder"
git push
```

### Task 8: AI operations frontend

**Files:**
- Create: `src/features/ai/api/AdminAiApiClient.ts`
- Create: `src/features/ai/api/AdminAiApiClient.test.ts`
- Create: `src/features/ai/admin/AdminAiDashboard.tsx`
- Create: `src/features/ai/admin/AdminAiDashboard.module.css`
- Create: `src/features/ai/admin/AiOverview.tsx`
- Create: `src/features/ai/admin/AiPromptWorkspace.tsx`
- Create: `src/features/ai/admin/AiKnowledgeWorkspace.tsx`
- Create: `src/features/ai/admin/AiRulesWorkspace.tsx`
- Create: `src/features/ai/admin/AiLogWorkspace.tsx`
- Create: `src/features/ai/admin/AdminAiDashboard.test.tsx`
- Create: `src/app/admin/ai/page.tsx`
- Modify: `src/features/price/admin/AdminAccessGate.tsx`

**Interfaces:**
- Reuses the session-scoped Admin Key pattern; the access gate receives title/description props with price-safe defaults.
- Admin mutations return authoritative versions and refresh only affected resources.

- [ ] **Step 1: Write failing Admin client and workspace tests**

Test unlock, prompt update, knowledge archive/sync, rule toggle, log privacy fields and optimistic conflict rendering.

- [ ] **Step 2: Run RED**

Run: `pnpm vitest run src/features/ai/admin src/features/ai/api/AdminAiApiClient.test.ts`

- [ ] **Step 3: Implement the protected workspace**

Split each tab by responsibility; no page or component exceeds 250 pure lines. Keep raw user messages absent from all schemas and UI.

- [ ] **Step 4: Run GREEN and production build**

Run: `pnpm test:run && pnpm typecheck && pnpm lint && pnpm build`

- [ ] **Step 5: Commit and push**

```powershell
git add -- src/features/ai src/features/price/admin/AdminAccessGate.tsx src/app/admin/ai
git commit -m "Build AI operations console"
git push
```

### Task 9: Live integration, visual QA, cleanup and release

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `backend/.env.example`
- Create: `.omo/evidence/ai-builder-v1-*` (local only; never commit)

- [ ] **Step 1: Document configuration and route contracts**

Document rule-only defaults, optional model/embedding/Chroma variables, `/api/ai/build`, `/admin/ai` and privacy behaviour. Do not include real keys.

- [ ] **Step 2: Run complete verification**

```powershell
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
mvn -f backend/pom.xml test
mvn -f backend/pom.xml package -DskipTests
```

- [ ] **Step 3: Run live vertical-loop smoke**

Start the packaged backend on task-owned port 8088 and the production frontend on task-owned port 3100. Verify initial recommendation, modification, saved config retrieval, Admin AI overview and CORS preflight. Stop only those exact task-owned PIDs.

- [ ] **Step 4: Run browser visual QA**

Capture Builder closed/open/analyzing/proposal states and `/admin/ai` at 375, 768 and 1280px. Exercise keyboard focus, Escape, confirmation, reduced motion and long Chinese copy. Repair every Critical/Major issue and re-capture.

- [ ] **Step 5: Run code-quality and secret review**

Measure all changed source files, keep each ≤250 pure LOC, run React Doctor, scan for credentials and confirm `.omo/` is untracked.

- [ ] **Step 6: Commit release documentation**

```powershell
git add -- README.md .env.example backend/.env.example
git commit -m "Document AI Builder V1 operations"
git push
```

- [ ] **Step 7: Tag and verify remote release**

```powershell
git tag -a ai-builder-v1.0.0 -m "PC LAB 3D AI Builder System V1.0"
git push origin ai-builder-v1.0.0
git ls-remote origin refs/heads/codex/ai-builder-v1 refs/tags/ai-builder-v1.0.0^{}
```

Expected: branch and dereferenced tag resolve to the final verified commit.
