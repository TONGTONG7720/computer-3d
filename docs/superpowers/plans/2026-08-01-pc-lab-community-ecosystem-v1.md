# PC LAB 3D Community & Build Ecosystem V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan task-by-task. Track every checkbox and stop at each Sprint release gate.

**Goal:** Ship a real, reproducible PC-design community where a verified user can publish an immutable Builder snapshot, visitors can inspect it in 3D, copy it back to Builder, interact with the creator, enter challenges, and request an evidence-backed AI review or optimization.

**Architecture:** Extend the existing Spring Boot service as a bounded `community` module. MySQL remains authoritative, Redis stores rebuildable feed/ranking projections, and the current Build, Price and AI modules are composed through typed ports. Next.js adds isolated `community` routes and a props-driven read-only 3D renderer; public pages never mutate Builder/Engine global state.

**Tech Stack:** Java 21, Spring Boot 3.5, Spring Security, MyBatis Plus, MySQL 8, Redis, Flyway, Next.js 16 App Router, React 19, TypeScript strict mode, Zod 4, Zustand 5, React Three Fiber, Three.js, Framer Motion, CSS Modules, Vitest.

## Global constraints

- This plan begins only after `ai-builder-v1.0.1`; do not move or overwrite earlier release tags.
- Community is a build-design gallery, not a general forum. Do not add direct messages, arbitrary threads, checkout, creator payments or marketplace crawling.
- Public reads are anonymous. Publish, like, save, comment, follow, copy attribution and challenge submission require a verified session.
- Community identity never reuses `X-Admin-Key`; existing Admin authentication remains isolated under `/api/admin/**`.
- `build_config` is the source configuration. A published work owns a frozen component/metric hash and cannot be silently changed by live catalogue or price updates.
- Snapshot price and current best price are separate labelled values.
- All public IDs are opaque ULIDs/UUIDs. Never expose sequential database IDs, password hashes, session tokens, IP addresses or raw audit metadata.
- Server-calculated counters, scores, ranks, moderation states and actor IDs are never accepted from client DTOs.
- Relationship writes are idempotent and protected by unique indexes. Counter columns are projections; relationship/event rows are truth.
- AI review may explain deterministic facts. AI optimization returns a delta proposal and requires explicit confirmation before saving or applying.
- New production modules should remain below 250 non-blank, non-comment lines. Split by owned behaviour, not arbitrary wrappers.
- Implement every behaviour RED → GREEN → REFACTOR. Do not weaken global timeouts or assertions to make a test pass.
- No card may create its own unconstrained WebGL canvas. Use the shared live-viewer budget and poster fallback.
- `.omo/`, local credentials, generated QA captures and runtime uploads remain untracked.

## Release map

| Sprint | Tag | Shippable vertical slice |
|---|---|---|
| 1 | `community-foundation-v1.0.0` | Identity/session, drafts, publish, public Explore, like/save |
| 2 | `community-showcase-v1.0.0` | Read-only 3D cards, Build Detail, copy-to-Builder, live pricing |
| 3 | `community-social-v1.0.0` | Comments, follows, creator profile, collections, progression |
| 4 | `community-ranking-v1.0.0` | Trending, rankings, challenges, anti-abuse projections |
| 5 | `community-ai-v1.0.0` | AI review, explicit optimization, moderation and Admin operations |

Each tag is created only after its own backend, frontend, migration, security and visual acceptance gates pass.

---

## Sprint 1 — Identity and publishable community foundation

### Task 1: Add the verified user-session boundary

**Files:**

- Modify: `backend/pom.xml`
- Create: `backend/src/main/resources/db/migration/V6__create_community_identity.sql`
- Create: `backend/src/main/java/com/pclab/hardware/community/auth/{CurrentUser,SessionPrincipal,SessionService}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/auth/{AuthController,AuthRequest,AuthView}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/auth/{UserSessionEntity,UserSessionMapper}.java`
- Create: `backend/src/main/java/com/pclab/hardware/security/CommunitySecurityConfig.java`
- Test: `backend/src/test/java/com/pclab/hardware/community/auth/{SessionServiceTest,AuthControllerTest}.java`
- Test: `backend/src/test/java/com/pclab/hardware/security/CommunitySecurityConfigTest.java`

**Contract:** issue a 256-bit opaque token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie; persist only its SHA-256 hash with expiry/revocation. `CurrentUser.requireVerified()` supplies the actor to services. Password verification uses Spring Security's adaptive encoder and generic failure responses.

- [ ] Write failing tests for login, logout, expiry, revoked session, disabled user, CSRF rejection and public-route access.
- [ ] Add `spring-boot-starter-security`, the `user_session` table and typed session service.
- [ ] Configure `/api/community/**` GET routes as public, authenticated community writes as protected, and leave the existing Admin-key interceptor isolated.
- [ ] Prove client-supplied `userId` cannot impersonate another user.
- [ ] Run `mvn.cmd -f backend/pom.xml -Dtest=SessionServiceTest,AuthControllerTest,CommunitySecurityConfigTest test`.
- [ ] Commit `Add verified community sessions` and push the Sprint branch.

### Task 2: Create the core publication schema and domain

**Files:**

- Create: `backend/src/main/resources/db/migration/V7__create_community_core.sql`
- Create: `backend/src/main/java/com/pclab/hardware/community/domain/{PostStatus,PostVisibility,PostType,CommunityPost}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/entity/{BuildPostEntity,BuildPostTagEntity,BuildPostMediaEntity,BuildLikeEntity,BuildSaveEntity,CommunityEventEntity}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/mapper/*Mapper.java`
- Test: `backend/src/test/java/com/pclab/hardware/community/database/CommunityCoreMigrationContractTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/community/domain/CommunityPostStateMachineTest.java`

**Contract:** `DRAFT → GENERATING → REVIEW → PUBLISHED → ARCHIVED`; failed generation returns to `DRAFT` with a retryable reason. Published snapshots carry `build_snapshot_hash`, sanitized narrative, validated camera/RGB JSON and optimistic `version`.

- [ ] Write migration-contract tests for FKs, unique relationships, public IDs, indexes and checks.
- [ ] Create `build_post`, `build_post_tag`, `build_post_media`, `build_like`, `build_save` and `community_event` tables.
- [ ] Implement the transition state machine and immutable published-snapshot guard.
- [ ] Prove duplicate likes/saves are impossible at the database boundary.
- [ ] Run `mvn.cmd -f backend/pom.xml -Dtest=CommunityCoreMigrationContractTest,CommunityPostStateMachineTest test`.
- [ ] Commit `Create community publication domain` and push.

### Task 3: Implement draft, generation and publish APIs

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/community/controller/CommunityPublishController.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/dto/{CreateDraftRequest,UpdateDraftRequest,PublishPostRequest}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/vo/{DraftView,PublishReadinessView,PostSummaryView}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/service/{CommunityDraftService,CommunityPublishService,SnapshotIntegrityService,PosterGenerationPort}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/service/ProceduralPosterFallback.java`
- Test: `backend/src/test/java/com/pclab/hardware/community/service/{CommunityDraftServiceTest,CommunityPublishServiceTest}.java`
- Test: `backend/src/test/java/com/pclab/hardware/community/controller/CommunityPublishControllerTest.java`

**Endpoints:**

- `POST /api/community/posts/drafts`
- `PATCH /api/community/posts/drafts/{publicId}` with `If-Match` version
- `POST /api/community/posts/drafts/{publicId}/generate`
- `POST /api/community/posts/drafts/{publicId}/publish`
- `GET /api/community/my-posts?status=&cursor=`

- [ ] Write failing ownership, optimistic-lock, validation, XSS sanitization and idempotent-publish tests.
- [ ] Recalculate compatibility and metrics server-side before freezing the snapshot hash.
- [ ] Generate a poster job record; return a procedural fallback without losing the draft if generation fails.
- [ ] Publish only a complete, compatible/reviewed build owned by the current user.
- [ ] Emit `POST_PUBLISHED` and progression events in the same transaction/outbox boundary.
- [ ] Run targeted tests, then `mvn.cmd -f backend/pom.xml test`.
- [ ] Commit `Ship community publish workflow` and push.

### Task 4: Implement public Explore and like/save APIs

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/community/controller/CommunityFeedController.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/controller/CommunityReactionController.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/service/{CommunityFeedService,CommunityReactionService}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/vo/{CommunityFeedView,BuildCardView,CommunityActorView}.java`
- Test: `backend/src/test/java/com/pclab/hardware/community/service/{CommunityFeedServiceTest,CommunityReactionServiceTest}.java`
- Test: `backend/src/test/java/com/pclab/hardware/community/controller/CommunityFeedControllerTest.java`

**Endpoints:** `GET /api/community/feed?mode=EXPLORE&cursor=`, `PUT/DELETE /api/community/posts/{publicId}/like`, and `PUT/DELETE /api/community/posts/{publicId}/save`.

- [ ] Write failing cursor-stability, unpublished-visibility, anonymous-view and idempotent-reaction tests.
- [ ] Return component keys, poster, camera preset and a compact render manifest; never return internal IDs.
- [ ] Update counter projections atomically without treating them as source-of-truth rows.
- [ ] Cache only anonymous public pages; merge the signed-in viewer's reaction state after cache lookup.
- [ ] Run targeted and full backend tests.
- [ ] Commit `Add community discovery API` and push.

### Task 5: Build the Explore and Publish shells

**Files:**

- Create: `src/app/community/{page.tsx,loading.tsx,error.tsx}`
- Create: `src/app/community/my-builds/page.tsx`
- Create: `src/app/publish/page.tsx`
- Create: `src/features/community/domain/{community.ts,publish.ts}`
- Create: `src/features/community/api/{CommunityApiClient,PublishApiClient,SessionApiClient}.ts`
- Create: `src/features/community/explore/{CommunityHeader,FeaturedBuildStage,BuildGrid,BuildCardShell,TrendingHardwareStrip,ChallengeTeaser}.tsx`
- Create: `src/features/community/publish/{PublishWizard,BuildSourceStep,GenerateStep,DescribeStep,ReviewStep}.tsx`
- Create: `src/features/community/**/*.module.css`
- Test: `src/features/community/api/*.test.ts`
- Test: `src/features/community/explore/CommunityExplore.test.tsx`
- Test: `src/features/community/publish/PublishWizard.test.tsx`

- [ ] Define strict Zod schemas for every response and cursor; malformed data must fail before UI mutation.
- [ ] Write failing tests for loading, empty, error, anonymous, authenticated and autosaved-draft states.
- [ ] Implement the 12-column desktop and single-column mobile composition from the approved specification.
- [ ] Keep cards poster-first in Sprint 1; reserve a stable 280px stage for Sprint 2 live 3D activation.
- [ ] Implement a four-step, keyboard-operable publish flow with explicit public-data review.
- [ ] Run `pnpm lint`, `pnpm typecheck`, targeted Vitest and `pnpm build`.
- [ ] Perform visual QA at 1440×1024 and 390×844; verify no body-level horizontal overflow.
- [ ] Commit `Build community Explore and publish flow` and push.

### Sprint 1 release gate

- [ ] Anonymous users can browse published works but cannot mutate community state.
- [ ] A verified user can create, resume and publish one valid build without losing draft text on generation failure.
- [ ] Like/save toggles are idempotent and counters recover from source rows.
- [ ] Existing Builder, Price and AI suites remain green.
- [ ] Tag and push `community-foundation-v1.0.0`.

---

## Sprint 2 — Public 3D showcase and copy loop

### Task 6: Extract a props-driven read-only PC renderer

**Files:**

- Modify: `src/three/viewer/{PCViewer,PCScene}.tsx`
- Create: `src/three/viewer/{ReadOnlyPCViewer,PublicViewerState,PublicViewerControls}.tsx`
- Create: `src/features/community/three/{CommunityModelManifest,LiveViewerBudget,IntersectionViewerActivation}.ts`
- Test: `src/three/viewer/ReadOnlyPCViewer.test.tsx`
- Test: `src/features/community/three/{LiveViewerBudget,CommunityModelManifest}.test.ts`

**Contract:** render `componentIds`, camera preset, RGB theme and quality policy from immutable props. Do not import `builderStore` or `engineStore`; do not expose part replacement, selection mutation or installation commands.

- [ ] Write an architecture test that fails if the read-only viewer imports either global store.
- [ ] Extract shared scene primitives without changing the existing Builder viewer behaviour.
- [ ] Activate at most one featured and two card canvases desktop, one canvas mobile; use `IntersectionObserver` and poster fallback for the rest.
- [ ] Pause render loops when off-screen/hidden and honor reduced motion.
- [ ] Prove unsupported WebGL, failed GLB and slow-load paths keep the build readable.
- [ ] Run Three.js tests plus full frontend verification.
- [ ] Commit `Add read-only community 3D renderer` and push.

### Task 7: Ship public Build Detail and price context

**Files:**

- Create: `src/app/build/[postPublicId]/{page.tsx,loading.tsx,not-found.tsx}`
- Create: `src/features/community/detail/{BuildHero,CreatorRail,SnapshotSpecification,PerformanceStory,PriceContext,BuildNarrative,AiReviewPanel,RelatedBuilds}.tsx`
- Create: `src/features/community/api/BuildDetailApiClient.ts`
- Create: `backend/src/main/java/com/pclab/hardware/community/controller/CommunityPostController.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/service/CommunityPostDetailService.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/vo/CommunityPostDetailView.java`
- Test: `src/features/community/detail/BuildDetail.test.tsx`
- Test: `backend/src/test/java/com/pclab/hardware/community/service/CommunityPostDetailServiceTest.java`

**Endpoint:** `GET /api/community/posts/{postPublicId}` returns the frozen snapshot, author, story, social counts, current best-price summary and provenance; deleted/review content resolves as not found to public callers.

- [ ] Write failing tests for public/unlisted/deleted visibility and snapshot-vs-live price labels.
- [ ] Compose current prices through the existing Price service port; do not copy its ranking logic.
- [ ] Render the 60–68vh 3D hero, sticky author/spec rail and authored narrative hierarchy.
- [ ] Add semantic metadata, OG poster, canonical URL and JSON-LD without exposing internal IDs.
- [ ] Run backend/frontend suites and visual QA at desktop, tablet 768px and mobile.
- [ ] Commit `Ship interactive public build detail` and push.

### Task 8: Implement safe copy-to-Builder attribution

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/community/service/BuildDerivationService.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/controller/BuildDerivationController.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/dto/CreateBuildCopyRequest.java`
- Create: `src/features/community/copy/{CopyBuildDialog,CopyDeltaReport}.tsx`
- Create: `src/features/community/api/BuildCopyApiClient.ts`
- Modify: `src/features/builder/sync/BuilderEngineSync.ts`
- Test: `backend/src/test/java/com/pclab/hardware/community/service/BuildDerivationServiceTest.java`
- Test: `src/features/community/copy/CopyBuildDialog.test.tsx`

**Flow:** create a private derived snapshot → map current hardware catalogue → recalculate price/compatibility/power → show substitutions/deltas → require confirmation → apply through `BuilderEngineSync` → record `COPY_ACCEPTED` only after success.

- [ ] Test missing/discontinued components, incompatible remaps, source attribution and duplicate request idempotency.
- [ ] Do not count an impression or opened dialog as a successful copy.
- [ ] Confirm before any Builder/3D mutation and provide a reversible return link to the source work.
- [ ] Run integration tests proving all selected IDs and replacement commands match the accepted proposal.
- [ ] Commit `Connect community builds to Builder` and push.

### Sprint 2 release gate

- [ ] Hover/focus activates controlled card rotation; touch uses explicit activation and never hijacks page scroll.
- [ ] Build Detail remains usable with WebGL disabled and displays snapshot/current price separately.
- [ ] Copy creates a new private build, never edits the author snapshot, and records accepted attribution.
- [ ] Tag and push `community-showcase-v1.0.0`.

---

## Sprint 3 — Social graph, profiles and progression

### Task 9: Add comments, follows, collections and creator profiles

**Files:**

- Create: `backend/src/main/resources/db/migration/V8__create_community_social.sql`
- Create: `backend/src/main/java/com/pclab/hardware/community/{comment,follow,profile}/**/*.java`
- Create: `src/app/u/[username]/page.tsx`
- Create: `src/app/community/following/page.tsx`
- Create: `src/features/community/{comments,profile,following}/**/*.{ts,tsx,module.css}`
- Test: matching backend service/controller and frontend interaction tests.

**Schema:** `build_comment`, `user_follow`, `user_profile`, `user_collection`, `user_collection_item`, `progression_ledger`, `user_achievement`.

- [ ] Test comment sanitation, edit window, soft deletion, pagination and author/moderator permissions.
- [ ] Test self-follow rejection, idempotent follow and private collection ownership.
- [ ] Build creator profile sections for works, collections, history, alerts and achievements; expose only opted-in public sections.
- [ ] Drive levels from an append-only XP ledger with reason/idempotency key; never trust a mutable client level.
- [ ] Add block/mute-ready service boundaries without exposing unfinished UI.
- [ ] Verify keyboard navigation, focus restoration, long Chinese copy and empty/private states.
- [ ] Commit `Add community social graph and profiles` and push.

### Sprint 3 release gate

- [ ] Comment, follow and collection writes enforce actor ownership and rate limits.
- [ ] Profile counts and levels rebuild from authoritative rows/ledger.
- [ ] Following feed never leaks private or moderated works.
- [ ] Tag and push `community-social-v1.0.0`.

---

## Sprint 4 — Rankings, challenges and trustworthy projections

### Task 10: Build event aggregation, trending and category rankings

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/community/event/{CommunityEventService,CommunityProjectionJob,AbuseSignalPolicy}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/ranking/{ExploreRanker,TrendingRanker,BuildRankingService}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/config/CommunityProperties.java`
- Create: `src/app/community/{trending,ranking}/page.tsx`
- Create: `src/features/community/ranking/**/*.{ts,tsx,module.css}`
- Test: deterministic clock-based ranking, decay, fraud-weight and Redis rebuild tests.

- [ ] Encode the approved Explore/Trending formulas in named typed policies, not controllers or SQL literals.
- [ ] Deduplicate view sessions and reduce weight for self-interaction, suspicious velocity and repeated devices.
- [ ] Project hour/day/week candidates to Redis sorted sets; prove complete rebuild from MySQL events.
- [ ] Publish performance, value and appearance boards with visible rules and price timestamps.
- [ ] Add fallback MySQL ordering when Redis is unavailable; serve stale-labelled results rather than fail the page.
- [ ] Commit `Add trustworthy community rankings` and push.

### Task 11: Implement challenge lifecycle and submissions

**Files:**

- Create: `backend/src/main/resources/db/migration/V9__create_community_challenges.sql`
- Create: `backend/src/main/java/com/pclab/hardware/community/challenge/**/*.java`
- Create: `src/app/community/challenges/{page.tsx,[challengePublicId]/page.tsx}`
- Create: `src/features/community/challenge/**/*.{ts,tsx,module.css}`
- Test: lifecycle, immutable rule-set, deadline, budget timestamp and one-active-entry tests.

**Lifecycle:** `DRAFT → SCHEDULED → LIVE → LOCKED → SETTLED → ARCHIVED`. A submission freezes component snapshot, price source timestamp, compatibility, score evidence and rules version.

- [ ] Reject late, over-budget, incompatible or ineligible entries server-side.
- [ ] Support revisions only when the challenge rule set explicitly enables them.
- [ ] Separate community votes from objective performance/value score; show both.
- [ ] Award XP/badges through idempotent settlement events.
- [ ] Commit `Ship configuration challenges` and push.

### Sprint 4 release gate

- [ ] Rankings are deterministic under a fixed clock and rebuildable after Redis flush.
- [ ] Challenge rule/version evidence cannot change after the first valid submission.
- [ ] Fraud-weighted interactions do not affect public counts/ranks as full-value events.
- [ ] Tag and push `community-ranking-v1.0.0`.

---

## Sprint 5 — AI review, optimization and moderation

### Task 12: Add evidence-backed AI review and explicit optimization

**Files:**

- Create: `backend/src/main/resources/db/migration/V10__create_community_ai.sql`
- Create: `backend/src/main/java/com/pclab/hardware/community/ai/{CommunityAiReviewService,CommunityOptimizationService,CommunityModerationService}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/ai/{CommunityReviewView,OptimizationProposalView,ModerationDecision}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/controller/CommunityAiController.java`
- Create: `src/features/community/ai/{CommunityAiReview,AiOptimizeDialog,AiOptimizationDelta}.tsx`
- Create: `src/app/admin/community/page.tsx`
- Create: `src/features/community/admin/**/*.{ts,tsx,module.css}`
- Test: backend evidence/proposal/moderation tests and frontend confirmation tests.

**Endpoints:**

- `POST /api/community/posts/{publicId}/ai-review`
- `POST /api/community/posts/{publicId}/optimize`
- `POST /api/community/posts/{publicId}/optimize/{proposalId}/accept`
- protected `/api/admin/community/review-queue/**`

- [ ] Reuse compatibility, metrics, Price and AI Builder ports; never duplicate solver rules.
- [ ] Require every published strength/constraint to cite a deterministic metric, rule or knowledge document.
- [ ] Let users lock parts and set a target budget; return exact price/performance/power/component deltas and shortfall.
- [ ] Save/apply only after explicit acceptance; create `AI_OPTIMIZE` derivation attribution.
- [ ] Route confidence-sensitive moderation to human review; never auto-publish unsafe/unverified generated copy.
- [ ] Keep raw private drafts out of AI logs and redact message/content payloads from operator traces.
- [ ] Commit `Add AI community review and optimization` and push.

### Task 13: Complete observability, resilience and release protection

**Files:**

- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/java/com/pclab/hardware/security/{RateLimitInterceptor,RequestTraceFilter}.java`
- Create: `backend/src/main/java/com/pclab/hardware/community/observability/CommunityMetrics.java`
- Create: `docs/runbooks/community-operations.md`
- Create: `docs/runbooks/community-moderation.md`
- Create: `.github/workflows/community-release.yml`
- Update: `README.md`, `DESIGN.md`

- [ ] Add metrics for publish funnel, 3D engagement, copy accepted, save rate, feed latency, projection lag, moderation queue and purchase-panel opens.
- [ ] Define per-actor/IP limits for comments, reactions, follows, publication, copy and AI requests.
- [ ] Validate media MIME/size and storage paths; add CSP, signed upload policy and outbound-link allowlist.
- [ ] Add MySQL/Redis failure behaviour, projection replay and job idempotency runbooks.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test:run`, `pnpm build`, `mvn.cmd -f backend/pom.xml test` and `mvn.cmd -f backend/pom.xml -DskipTests package`.
- [ ] Run a production browser matrix at 1440×1024, 768×1024 and 390×844 for Explore, Build Detail, Publish, Profile, Ranking, Challenge and AI Optimize; include keyboard, Escape/focus, reduced motion, long Chinese text and WebGL fallback.
- [ ] Run dependency/secret scans and document any existing baseline findings separately from Community regressions.
- [ ] Apply release protection only after product behaviour is frozen: source maps off in production, server secrets outside bundles, model/media URLs signed where appropriate, integrity hashes for deploy artifacts, minification/obfuscation only where it does not break React/Three.js or licenses. Treat this as deterrence, never as a substitute for server authorization.
- [ ] Commit `Harden and document community release` and push.

### Sprint 5 final release gate

- [ ] A user can complete the north-star loop: AI/Builder → save → publish → public 3D → copy → compatibility/price refresh → accepted Builder configuration.
- [ ] Community AI cannot mutate a build without confirmation and all explanations have evidence.
- [ ] Public/API data exposes no sensitive identity or internal IDs.
- [ ] Feed/rank counters recover from authoritative rows after Redis loss.
- [ ] No Community page has horizontal overflow, inaccessible critical actions or unbounded WebGL canvases.
- [ ] Existing Builder, Hardware, Price and AI releases remain regression-green.
- [ ] Tag and push `community-ai-v1.0.0`.

## Final handoff artifacts

- Versioned Flyway migrations and rollback/recovery notes.
- OpenAPI contracts for public/authenticated/Admin endpoints.
- Figma-aligned responsive surface inventory and motion states.
- Three.js asset manifest, live-canvas budget and poster fallback policy.
- Ranking formula/version registry and projection replay procedure.
- AI evidence, optimization-confirmation and moderation policy.
- Security/privacy threat checklist and release protection record.
- Automated verification report plus current-revision visual QA matrix.
