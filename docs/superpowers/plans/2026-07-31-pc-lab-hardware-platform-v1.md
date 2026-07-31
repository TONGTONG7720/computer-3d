# PC LAB 3D Hardware Platform V1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable Spring Boot hardware data center backed by MySQL and Redis, then make the existing Builder consume its REST API.

**Architecture:** A modular Spring Boot monolith owns hardware, category-specific specifications, models, prices, and saved builds. Flyway creates and seeds MySQL, Redis provides cache-aside reads and rate limiting, and the Next.js client parses all API data through Zod before hydrating Zustand.

**Tech Stack:** Java 21, Spring Boot 3.5.16, MyBatis-Plus 3.5.17, MySQL-compatible SQL, Redis, Flyway, Maven, Next.js 16, TypeScript, Zod, Zustand.

## Global Constraints

- Backend port is `8088`; frontend remains `3000`.
- Credentials and Admin Key come from environment variables and are never committed.
- Public production data comes from REST API; frontend mock data remains test-only.
- No marketplace API, payment, order, AI chat, login, or registration work.
- Every milestone must leave both frontend and backend runnable.

---

### Task 1: Backend foundation and executable contract

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/pclab/hardware/HardwarePlatformApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/pclab/hardware/vo/ApiResponse.java`
- Create: `backend/src/main/java/com/pclab/hardware/exception/GlobalExceptionHandler.java`
- Create: `backend/src/test/java/com/pclab/hardware/HardwarePlatformApplicationTests.java`
- Modify: `.gitignore`

**Interfaces:**
- Produces: Spring application on port `8088`, `ApiResponse<T>`, trace-aware error envelope.
- Consumes: `PC_LAB_DB_*`, `PC_LAB_REDIS_*`, `PC_LAB_ADMIN_KEY`.

- [ ] Write a context test that expects the Spring application and health endpoint configuration to load under the test profile.
- [ ] Run `mvn -f backend/pom.xml test` and confirm RED because the backend project does not exist.
- [ ] Add the Java 21 Maven project, typed configuration, Actuator, Validation, MyBatis-Plus, Redis and Flyway dependencies.
- [ ] Add the application entry point, response envelope and global exception mapping.
- [ ] Run `mvn -f backend/pom.xml test` and confirm GREEN.
- [ ] Commit as `Establish hardware platform backend`.

### Task 2: Flyway schema and seeded hardware catalogue

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__create_hardware_platform.sql`
- Create: `backend/src/main/resources/db/migration/V2__seed_builder_hardware.sql`
- Create: `backend/src/main/java/com/pclab/hardware/entity/*.java`
- Create: `backend/src/main/java/com/pclab/hardware/mapper/*.java`
- Create: `backend/src/test/java/com/pclab/hardware/database/SeedDataContractTest.java`

**Interfaces:**
- Produces: normalized base/spec/model/price/build tables and 22 seeded hardware rows.
- Produces: stable keys matching `src/features/builder/data/mock*.ts`.

- [ ] Write a test that asserts the expected category codes and stable hardware keys.
- [ ] Run the focused test and confirm RED because seed contracts are absent.
- [ ] Add MySQL-compatible DDL with indexes, foreign keys, JSON columns and optimistic version fields.
- [ ] Add seeds for CPU, GPU, motherboard, memory, storage, cooling, PSU and case data plus primary models and internal prices.
- [ ] Add MyBatis-Plus entities and base mappers with no controller exposure.
- [ ] Run unit tests, then launch against local MySQL and query Flyway history plus row counts.
- [ ] Commit as `Create hardware database schema`.

### Task 3: Public hardware, search, model and price APIs

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/dto/HardwareQuery.java`
- Create: `backend/src/main/java/com/pclab/hardware/vo/HardwareView.java`
- Create: `backend/src/main/java/com/pclab/hardware/vo/PageView.java`
- Create: `backend/src/main/java/com/pclab/hardware/service/HardwareQueryService.java`
- Create: `backend/src/main/java/com/pclab/hardware/controller/HardwareController.java`
- Create: `backend/src/main/java/com/pclab/hardware/controller/ModelController.java`
- Create: `backend/src/main/java/com/pclab/hardware/controller/PriceController.java`
- Create: `backend/src/test/java/com/pclab/hardware/controller/HardwareControllerTest.java`

**Interfaces:**
- Produces: `GET /api/hardware`, `/api/hardware/cpu`, `/api/hardware/gpu`, `/api/hardware/{idOrKey}`, `/api/model/{idOrKey}`, `/api/prices/{idOrKey}`.
- Returns: `ApiResponse<PageView<HardwareView>>` and `ApiResponse<HardwareView>`.

- [ ] Write MockMvc contract tests for pagination, `RTX5090` search, category shortcut, detail-not-found and validation errors.
- [ ] Run tests and confirm RED because controllers and services are missing.
- [ ] Implement allow-listed sort parsing, normalized keyword search and category-specific specification joins.
- [ ] Implement view mapping that emits `builderCategory` and flattened category fields.
- [ ] Run controller tests and a real HTTP smoke call against MySQL.
- [ ] Commit as `Expose hardware catalogue APIs`.

### Task 4: Build persistence and Admin data management

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/dto/SaveBuildRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/service/BuildConfigService.java`
- Create: `backend/src/main/java/com/pclab/hardware/controller/BuildController.java`
- Create: `backend/src/main/java/com/pclab/hardware/dto/HardwareMutationRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/service/AdminHardwareService.java`
- Create: `backend/src/main/java/com/pclab/hardware/controller/AdminHardwareController.java`
- Create: `backend/src/main/java/com/pclab/hardware/storage/ModelStorageService.java`
- Test: `backend/src/test/java/com/pclab/hardware/service/BuildConfigServiceTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/controller/AdminHardwareControllerTest.java`

**Interfaces:**
- Produces: `POST /api/build`, `GET /api/build/{publicId}`.
- Produces: Admin CRUD, model upload and internal price update endpoints.

- [ ] Write tests that reject a missing component, derive totals from repository data, reject an invalid Admin Key and accept a valid Admin Key.
- [ ] Run tests and confirm RED.
- [ ] Implement transactional build persistence with server-derived price, power, performance and compatibility.
- [ ] Implement category-aware hardware/spec mutations with optimistic version checks.
- [ ] Implement safe GLB storage with generated names, header validation, size limit and SHA-256.
- [ ] Run focused tests and real save/read HTTP smoke scenarios.
- [ ] Commit as `Add build and admin data services`.

### Task 5: Redis cache, rate limiting, trace logging and degradation

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/config/RedisConfig.java`
- Create: `backend/src/main/java/com/pclab/hardware/security/RequestTraceFilter.java`
- Create: `backend/src/main/java/com/pclab/hardware/security/AdminKeyInterceptor.java`
- Create: `backend/src/main/java/com/pclab/hardware/security/RateLimitInterceptor.java`
- Modify: `backend/src/main/java/com/pclab/hardware/service/HardwareQueryService.java`
- Test: `backend/src/test/java/com/pclab/hardware/security/AdminKeyInterceptorTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/security/RateLimitInterceptorTest.java`

**Interfaces:**
- Produces: `pclab:v1:*` JSON caches, `X-Trace-Id`, fixed-window Redis rate limit and fail-open cache behavior.

- [ ] Write tests for trace propagation, constant-time Admin Key checks, rate-limit response and Redis failure degradation.
- [ ] Run tests and confirm RED.
- [ ] Configure JSON cache serialization and TTLs.
- [ ] Add cache annotations and mutation-driven eviction.
- [ ] Add request filter and interceptors with structured logs.
- [ ] Stop Redis temporarily, prove MySQL fallback works, restart Redis and prove cache keys are created.
- [ ] Commit as `Harden and cache hardware APIs`.

### Task 6: Builder API hydration and server-backed save

**Files:**
- Create: `src/features/builder/api/HardwareApiClient.ts`
- Create: `src/features/builder/api/HardwareApiClient.test.ts`
- Create: `src/features/builder/api/BuildApiClient.ts`
- Create: `src/features/builder/components/HardwareDataBoundary.tsx`
- Modify: `src/features/builder/domain/hardware.ts`
- Modify: `src/store/builderStore.ts`
- Modify: `src/features/builder/components/ComponentSelector.tsx`
- Modify: `src/features/builder/components/RecommendationDialog.tsx`
- Modify: `src/features/builder/components/SaveBuildDialog.tsx`
- Modify: `src/features/engine/EngineDemo.tsx`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: Zod-parsed `fetchHardwareCatalogue()`, `saveBuildToApi()`, `initializeCatalogue()`, retryable catalogue states.
- Consumes: Spring API at `NEXT_PUBLIC_PC_LAB_API_URL`, default `http://127.0.0.1:8088/api`.

- [ ] Write API parser tests for every category, SSD/HDD mapping, malformed payload rejection and network errors.
- [ ] Run Vitest and confirm RED.
- [ ] Add API schemas and clients with abort timeout.
- [ ] Extend Zustand with catalogue lifecycle and hydrate default selections from stable IDs.
- [ ] Replace UI imports of `getHardwareByCategory` and `mockHardware` with Store catalogue.
- [ ] Save to backend first and maintain LocalStorage as an offline copy.
- [ ] Add loading, error, empty and retry states under existing design tokens.
- [ ] Run frontend tests, typecheck and production build.
- [ ] Commit as `Connect Builder to hardware platform`.

### Task 7: Full-stack acceptance and release

**Files:**
- Create: `backend/README.md`
- Create: `backend/.env.example`
- Create: `docs/architecture/PC-LAB-3D-Hardware-Platform-V1.0.md`
- Modify: `package.json`
- Modify: `README.md` if present

**Interfaces:**
- Produces: reproducible local startup instructions and release evidence.

- [ ] Start MySQL and Redis, run the backend on `8088`, and run the frontend on an available port.
- [ ] Verify health, category/list/search/detail/model/price/build APIs with real HTTP requests.
- [ ] Drive the Builder in desktop and mobile browser sizes; select a GPU and CPU, verify scene replacement and summary updates, then save and reload a build.
- [ ] Run `mvn -f backend/pom.xml verify` and `pnpm verify`.
- [ ] Confirm `git diff --check`, clean logs, and no marketplace endpoints.
- [ ] Push milestone branch, merge to `main`, tag `hardware-platform-v1.0.0`, push the tag, and stop temporary QA processes.
