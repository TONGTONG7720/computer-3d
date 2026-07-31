# PC LAB 3D Price Intelligence V1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete manual-commerce price intelligence vertical slice: migrated product data, explainable matching and ranking, public/Admin APIs, `/admin/prices`, Builder comparison, trends, click tracking, and release documentation.

**Architecture:** Extend the existing Spring Boot modular monolith with an isolated `price` domain while preserving the legacy `/api/prices/{idOrKey}` contract. MySQL is authoritative, Redis accelerates summaries/history, `ManualCatalogAdapter` is the only V1 adapter, and Next.js consumes Zod-validated APIs for Admin and Builder surfaces.

**Tech Stack:** Java 21, Spring Boot 3.5, MyBatis Plus, Flyway, MySQL 8, Redis, Next.js 16, React 19, TypeScript 6, ky, Zod, Zustand, Framer Motion, CSS Modules.

## Global Constraints

- Do not call Taobao, JD, PDD, or any other marketplace API in V1.
- Do not crawl or synthesize marketplace data.
- Preserve and migrate all existing `product_price` rows.
- All monetary calculations are server-authoritative `BigDecimal` calculations.
- Public ranking separates `lowestOffer` from `recommendedOffer`.
- Purchase redirects accept only stored, reviewed HTTPS links on platform allowlists.
- Admin requests require `X-Admin-Key`; the UI stores it only in `sessionStorage`.
- Redis failures must fall back to MySQL.
- Keep user, community, AI, order, and payment features out of scope.
- Use the existing dark laboratory design system and verify 1440×1024 plus 390×844.
- Each task follows red-green TDD and ends in an atomic pushed commit.

---

## File Structure Map

### Backend

```text
backend/src/main/java/com/pclab/hardware/price/
├── adapter/
│   ├── ManualCatalogAdapter.java
│   ├── PlatformAdapter.java
│   └── PlatformAdapterRegistry.java
├── algorithm/
│   ├── BestPriceAlgorithm.java
│   ├── ProductMatchingEngine.java
│   └── PromotionCalculator.java
├── controller/
│   ├── AdminPriceController.java
│   └── PriceIntelligenceController.java
├── domain/
│   ├── PlatformCode.java
│   ├── PriceRanking.java
│   └── ProductMatch.java
├── dto/
│   ├── AdminPriceRequests.java
│   ├── BuildQuoteRequest.java
│   └── PriceSearchEventRequest.java
├── entity/
│   ├── PriceClickEventEntity.java
│   ├── PriceHistoryEntity.java
│   ├── PriceSearchEventEntity.java
│   ├── ProductEntity.java
│   └── ProductMatchAuditEntity.java
├── mapper/
│   ├── PriceClickEventMapper.java
│   ├── PriceHistoryMapper.java
│   ├── PriceSearchEventMapper.java
│   ├── ProductMapper.java
│   └── ProductMatchAuditMapper.java
├── scheduler/
│   └── PriceRefreshScheduler.java
├── service/
│   ├── AdminPriceService.java
│   ├── ClickRedirectService.java
│   ├── PriceComparisonService.java
│   └── PriceHistoryService.java
└── vo/
    ├── AdminPriceViews.java
    ├── BuildQuoteView.java
    ├── PriceComparisonView.java
    └── PriceHistoryView.java
```

Existing files modified:

- `backend/src/main/java/com/pclab/hardware/entity/ProductPriceEntity.java`
- `backend/src/main/java/com/pclab/hardware/mapper/ProductPriceMapper.java`
- `backend/src/main/java/com/pclab/hardware/service/HardwareQueryService.java`
- `backend/src/main/java/com/pclab/hardware/config/RedisCacheConfig.java`
- `backend/src/main/java/com/pclab/hardware/exception/ErrorCode.java`
- `backend/src/main/resources/application.yml`

### Frontend

```text
src/features/price/
├── admin/
│   ├── AdminPriceDashboard.module.css
│   ├── AdminPriceDashboard.tsx
│   ├── OfferEditor.tsx
│   └── ProductEditor.tsx
├── api/
│   ├── AdminPriceApiClient.test.ts
│   ├── AdminPriceApiClient.ts
│   ├── PriceApiClient.test.ts
│   └── PriceApiClient.ts
├── builder/
│   ├── PriceComparisonDialog.module.css
│   ├── PriceComparisonDialog.test.tsx
│   ├── PriceComparisonDialog.tsx
│   └── PriceTrendChart.tsx
└── domain/
    └── price.ts

src/app/admin/prices/
└── page.tsx
```

Existing files modified:

- `src/features/engine/EngineDemo.tsx`
- `src/features/builder/components/BuildSummary.tsx`
- `src/features/builder/components/BuildSummary.module.css`
- `src/features/builder/components/ComponentSelector.tsx`
- `src/features/builder/components/ComponentSelector.module.css`
- `README.md`
- `DESIGN.md`

---

### Task 1: Migrate Product and Price Data

**Files:**

- Create: `backend/src/main/resources/db/migration/V3__create_price_intelligence.sql`
- Create: `backend/src/test/java/com/pclab/hardware/price/database/PriceMigrationContractTest.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/entity/ProductEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/entity/PriceHistoryEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/entity/PriceClickEventEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/entity/PriceSearchEventEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/entity/ProductMatchAuditEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/mapper/ProductMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/mapper/PriceHistoryMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/mapper/PriceClickEventMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/mapper/PriceSearchEventMapper.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/mapper/ProductMatchAuditMapper.java`
- Modify: `backend/src/main/java/com/pclab/hardware/entity/ProductPriceEntity.java`

**Interfaces:**

- Produces: `ProductEntity`, expanded `ProductPriceEntity`, history and analytics entities.
- Invariant: every migrated `product_price.product_id` references one generated `product`.

- [ ] **Step 1: Write migration contract tests**

Test exact table/column/constraint tokens and an executable H2-compatible schema fixture:

```java
@Test
void migrationCreatesProductHistoryAndAnalyticsTables() {
    String sql = migrationSql("V3__create_price_intelligence.sql");
    assertThat(sql).contains(
            "CREATE TABLE product",
            "CREATE TABLE price_history",
            "CREATE TABLE price_click_event",
            "CREATE TABLE price_search_event",
            "CREATE TABLE product_match_audit",
            "ADD COLUMN product_id"
    );
}

@Test
void migrationBackfillsLegacyPricesBeforeMakingProductRequired() {
    String sql = migrationSql("V3__create_price_intelligence.sql");
    assertThat(sql.indexOf("UPDATE product_price")).isLessThan(
            sql.indexOf("MODIFY COLUMN product_id BIGINT UNSIGNED NOT NULL")
    );
}
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
mvn -f backend/pom.xml -Dtest=PriceMigrationContractTest test
```

Expected: failure because V3 does not exist.

- [ ] **Step 3: Create V3 migration**

The migration must:

1. create `product`;
2. add nullable commerce columns to `product_price`;
3. insert one INTERNAL product per legacy price row;
4. backfill `product_id`;
5. rename `source` to `platform` and `price` to `sale_price`;
6. calculate `final_price=sale_price`;
7. remove the legacy `hardware_id` foreign key/column only after backfill;
8. add new foreign keys and unique keys;
9. create history, click, search, and audit tables;
10. seed 30 days of clearly marked MANUAL demo offers/history for the featured GPU/CPU set.

- [ ] **Step 4: Add entities and mappers**

Use explicit field names matching migration columns. Expanded offer fields:

```java
private Long productId;
private String platform;
private String seller;
private String shopType;
private BigDecimal salePrice;
private BigDecimal couponAmount;
private BigDecimal fullReductionAmount;
private BigDecimal memberDiscountAmount;
private BigDecimal platformSubsidyAmount;
private BigDecimal shippingFee;
private BigDecimal finalPrice;
private Integer salesCount;
private BigDecimal rating;
private BigDecimal sellerScore;
private String stockStatus;
private String promotionJson;
private String productUrl;
private String affiliateUrl;
private String recordSource;
private LocalDateTime checkedAt;
```

- [ ] **Step 5: Run database and application tests**

Run:

```powershell
mvn -f backend/pom.xml -Dtest=PriceMigrationContractTest,SeedDataContractTest,HardwarePlatformApplicationTests test
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit and push**

```powershell
git add backend/src/main/resources/db/migration/V3__create_price_intelligence.sql backend/src/main/java/com/pclab/hardware/price backend/src/main/java/com/pclab/hardware/entity/ProductPriceEntity.java backend/src/test/java/com/pclab/hardware/price
git commit -m "Create price intelligence data model"
git push
```

---

### Task 2: Implement Matching, Promotions, and Ranking

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/price/domain/PlatformCode.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/domain/ProductMatch.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/domain/PriceRanking.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/algorithm/ProductMatchingEngine.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/algorithm/PromotionCalculator.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/algorithm/BestPriceAlgorithm.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/algorithm/ProductMatchingEngineTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/algorithm/PromotionCalculatorTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/algorithm/BestPriceAlgorithmTest.java`

**Interfaces:**

```java
ProductMatch match(String title, HardwareView candidate);
BigDecimal finalPrice(PromotionInput input);
PriceRanking rank(List<RankableOffer> offers, LocalDateTime now);
```

- [ ] **Step 1: Write RED tests for normalization and conflict rejection**

```java
@Test
void matchesChineseAndEnglishRtx5090Titles() {
    ProductMatch result = engine.match(
            "华硕 RTX5090 OC 32G",
            hardware("ASUS", "NVIDIA GeForce RTX 5090", "GPU", Map.of("vramGb", 32))
    );
    assertThat(result.confidence()).isGreaterThanOrEqualTo(new BigDecimal("0.88"));
    assertThat(result.dimensionScores()).containsKeys("brand", "model", "spec", "category");
}

@Test
void rejectsGpuBracketAccessory() {
    ProductMatch result = engine.match("RTX5090 显卡支架", rtx5090());
    assertThat(result.decision()).isEqualTo(MatchDecision.REJECTED);
}
```

- [ ] **Step 2: Implement deterministic normalization**

Use NFKC, uppercase, brand aliases, compact model tokens, capacity extraction, noise removal, accessory/refurbished penalties, and dimension explanations. No external model calls.

- [ ] **Step 3: Write and pass promotion boundary tests**

```java
assertThat(calculator.finalPrice(new PromotionInput(
        bd("9499"), bd("100"), bd("200"), bd("50"), bd("150"), bd("0")
))).isEqualByComparingTo("8999");
```

Reject a negative amount and any discount total above sale price with `PRICE_PROMOTION_INVALID`.

- [ ] **Step 4: Write and pass ranking tests**

Create three offers where PDD is cheapest but JD self-operated wins the weighted recommendation. Assert:

```java
assertThat(result.lowest().platform()).isEqualTo(PDD);
assertThat(result.recommended().platform()).isEqualTo(JD);
assertThat(result.recommendedReason()).contains("自营", "价差");
```

- [ ] **Step 5: Run focused tests**

```powershell
mvn -f backend/pom.xml -Dtest=ProductMatchingEngineTest,PromotionCalculatorTest,BestPriceAlgorithmTest test
```

Expected: all focused tests pass.

- [ ] **Step 6: Commit and push**

```powershell
git add backend/src/main/java/com/pclab/hardware/price/algorithm backend/src/main/java/com/pclab/hardware/price/domain backend/src/test/java/com/pclab/hardware/price/algorithm
git commit -m "Add explainable price algorithms"
git push
```

---

### Task 3: Build Price Services, Adapter Boundary, Cache, and Scheduler

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/price/adapter/PlatformAdapter.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/adapter/PlatformAdapterRegistry.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/adapter/ManualCatalogAdapter.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/service/PriceComparisonService.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/service/PriceHistoryService.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/vo/PriceComparisonView.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/vo/PriceHistoryView.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/vo/BuildQuoteView.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/scheduler/PriceRefreshScheduler.java`
- Modify: `backend/src/main/java/com/pclab/hardware/config/RedisCacheConfig.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/java/com/pclab/hardware/service/HardwareQueryService.java`
- Modify: `backend/src/main/java/com/pclab/hardware/vo/PriceView.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/adapter/PlatformAdapterRegistryTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/PriceComparisonServiceTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/PriceHistoryServiceTest.java`

**Interfaces:**

```java
interface PlatformAdapter {
    PlatformCode platform();
    boolean isEnabled();
    List<PlatformProductCandidate> searchProduct(PlatformSearchRequest request);
    PlatformPriceSnapshot getPrice(PlatformProductRef reference);
    PlatformProductDetail getDetail(PlatformProductRef reference);
}

PriceComparisonView compareHardware(String idOrKey);
PriceHistoryView history(String idOrKey, HistoryRange range, PlatformCode platform);
BuildQuoteView quote(List<String> hardwareKeys);
```

- [ ] **Step 1: Write RED service tests**

Cover cacheable comparison assembly, stale flags, empty/internal-only state, and daily minimum aggregation.

- [ ] **Step 2: Implement adapter registry and manual adapter**

The registry returns only enabled adapters. `ManualCatalogAdapter` reads MySQL and never performs network I/O.

- [ ] **Step 3: Implement comparison and history services**

Join product, current offer, hardware, and price history. Filter public candidates through safety gates before ranking.

- [ ] **Step 4: Extend Redis configuration**

Add:

```java
"price-comparison" -> 5 minutes
"price-history" -> 15 minutes
"price-build" -> 2 minutes
"price-hot" -> 10 minutes
"price-admin" -> 1 minute
```

- [ ] **Step 5: Add scheduler**

Hourly task prewarms hot hardware and flags stale coverage in logs; daily task scans normal hardware. In `MANUAL` mode it never changes prices.

- [ ] **Step 6: Preserve legacy API**

`GET /api/prices/{idOrKey}` continues returning a list and maps `salePrice/finalPrice` to the existing response fields. Add deprecation text to documentation, not the payload.

- [ ] **Step 7: Run focused and regression tests**

```powershell
mvn -f backend/pom.xml -Dtest=PlatformAdapterRegistryTest,PriceComparisonServiceTest,PriceHistoryServiceTest,HardwareControllerTest test
```

- [ ] **Step 8: Commit and push**

```powershell
git add backend/src/main/java/com/pclab/hardware/price backend/src/main/java/com/pclab/hardware/config/RedisCacheConfig.java backend/src/main/java/com/pclab/hardware/service/HardwareQueryService.java backend/src/main/resources/application.yml backend/src/test
git commit -m "Create price comparison services"
git push
```

---

### Task 4: Expose Public Price, Trend, Quote, and Redirect APIs

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/price/controller/PriceIntelligenceController.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/dto/BuildQuoteRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/dto/PriceSearchEventRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/service/ClickRedirectService.java`
- Modify: `backend/src/main/java/com/pclab/hardware/exception/ErrorCode.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/controller/PriceIntelligenceControllerTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/ClickRedirectServiceTest.java`

**Interfaces:**

```http
GET  /api/price-intelligence/hardware/{idOrKey}
GET  /api/price-intelligence/hardware/{idOrKey}/history?range=7D|30D
POST /api/price-intelligence/build/quote
POST /api/price-intelligence/search-events
GET  /api/price-intelligence/offers/{offerId}/go
```

- [ ] **Step 1: Write controller contract tests**

Assert stable envelopes, 7D validation, build quote limits of exactly 1–8 hardware keys, and no raw affiliate URL in comparison JSON.

- [ ] **Step 2: Write redirect security tests**

Accept reviewed HTTPS links on the configured platform allowlist; reject `javascript:`, HTTP, unknown domains, disabled offers, and out-of-stock offers.

- [ ] **Step 3: Implement controller and analytics writes**

`go` writes `price_click_event`, then returns `ResponseEntity.status(FOUND).location(reviewedUri)`.

- [ ] **Step 4: Add error codes**

```text
PRICE_PRODUCT_NOT_FOUND
PRICE_OFFER_NOT_FOUND
PRICE_PROMOTION_INVALID
PRICE_REDIRECT_BLOCKED
PRICE_RANGE_INVALID
```

- [ ] **Step 5: Run focused tests**

```powershell
mvn -f backend/pom.xml -Dtest=PriceIntelligenceControllerTest,ClickRedirectServiceTest test
```

- [ ] **Step 6: Commit and push**

```powershell
git add backend/src/main/java/com/pclab/hardware/price/controller backend/src/main/java/com/pclab/hardware/price/dto backend/src/main/java/com/pclab/hardware/price/service/ClickRedirectService.java backend/src/main/java/com/pclab/hardware/exception/ErrorCode.java backend/src/test
git commit -m "Expose public price intelligence APIs"
git push
```

---

### Task 5: Implement Admin Product and Offer Management APIs

**Files:**

- Create: `backend/src/main/java/com/pclab/hardware/price/controller/AdminPriceController.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/dto/AdminPriceRequests.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/vo/AdminPriceViews.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/service/AdminPriceService.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/controller/AdminPriceControllerTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/AdminPriceServiceTest.java`

**Interfaces:**

```java
ProductAdminView createProduct(CreateProductRequest request);
MatchPreviewView previewMatch(MatchPreviewRequest request);
ProductAdminView confirmMatch(long productId, ConfirmMatchRequest request);
OfferAdminView createOffer(long productId, UpsertOfferRequest request);
OfferAdminView updateOffer(long offerId, UpsertOfferRequest request);
AdminDashboardView dashboard();
```

- [ ] **Step 1: Write RED Admin controller tests**

Cover Bean Validation, duplicate platform/seller, invalid discount, invalid URL, missing hardware, and successful match preview.

- [ ] **Step 2: Implement transactional product workflows**

On product create/update:

- normalize title;
- compute candidates;
- reject publish below 0.65 unless an Admin explicitly confirms a hardware ID;
- write `product_match_audit`;
- evict relevant caches after commit.

- [ ] **Step 3: Implement transactional offer workflows**

Recalculate `final_price`, validate allowlist, use optimistic lock, and write history only when final price changes.

- [ ] **Step 4: Implement dashboard**

Return active products, valid offers, stale offers, missing coverage, 24-hour clicks, and top clicked hardware.

- [ ] **Step 5: Run tests**

```powershell
mvn -f backend/pom.xml -Dtest=AdminPriceControllerTest,AdminPriceServiceTest,AdminKeyInterceptorTest test
```

- [ ] **Step 6: Commit and push**

```powershell
git add backend/src/main/java/com/pclab/hardware/price/controller/AdminPriceController.java backend/src/main/java/com/pclab/hardware/price/dto/AdminPriceRequests.java backend/src/main/java/com/pclab/hardware/price/service/AdminPriceService.java backend/src/main/java/com/pclab/hardware/price/vo/AdminPriceViews.java backend/src/test
git commit -m "Add manual price administration APIs"
git push
```

---

### Task 6: Create Frontend Price API Contracts

**Files:**

- Create: `src/features/price/domain/price.ts`
- Create: `src/features/price/api/PriceApiClient.ts`
- Create: `src/features/price/api/PriceApiClient.test.ts`
- Create: `src/features/price/api/AdminPriceApiClient.ts`
- Create: `src/features/price/api/AdminPriceApiClient.test.ts`

**Interfaces:**

```ts
export type PriceComparison = {
  hardwareKey: string;
  lowestPrice: number | null;
  lowestOfferId: number | null;
  recommendedOfferId: number | null;
  recommendedReason: string;
  offers: PriceOffer[];
  updatedAt: string | null;
};

export async function getPriceComparison(hardwareKey: string): Promise<PriceComparison>;
export async function getPriceHistory(
  hardwareKey: string,
  range: "7D" | "30D",
): Promise<PriceHistory>;
```

- [ ] **Step 1: Write RED Zod parsing tests**

Reject negative final price, rating above 5, confidence above 1, unsupported platform, invalid dates, and responses leaking `affiliateUrl`.

- [ ] **Step 2: Implement schemas and clients**

Reuse `apiClient.ts`; Admin methods accept an explicit Admin Key and set `X-Admin-Key` per request.

- [ ] **Step 3: Run tests**

```powershell
pnpm vitest run src/features/price/api
```

- [ ] **Step 4: Commit and push**

```powershell
git add src/features/price/api src/features/price/domain
git commit -m "Create price intelligence frontend clients"
git push
```

---

### Task 7: Build `/admin/prices`

**Files:**

- Create: `src/app/admin/prices/page.tsx`
- Create: `src/features/price/admin/AdminPriceDashboard.tsx`
- Create: `src/features/price/admin/AdminPriceDashboard.module.css`
- Create: `src/features/price/admin/ProductEditor.tsx`
- Create: `src/features/price/admin/OfferEditor.tsx`
- Test: `src/features/price/admin/AdminPriceDashboard.test.tsx`

**Interfaces:**

- Consumes: Admin Price API client.
- Produces: browser UI for product creation, match preview, offer maintenance, dashboard, and history.

- [ ] **Step 1: Write RED component tests**

Cover Admin Key entry, loading, error, filters, match score explanation, final-price preview, save success, and stale badge.

- [ ] **Step 2: Build the page shell**

Use a client component under a server route. Admin Key comes from `sessionStorage`, never URL or LocalStorage.

- [ ] **Step 3: Build dashboard and responsive product list**

Desktop uses table + right drawer; mobile uses cards + full-screen drawer. Use existing tokens from `globals.css`.

- [ ] **Step 4: Build product and offer editors**

Show server match dimensions and conflicts before enabling publication. Show:

```text
售价 - 优惠券 - 满减 - 会员价 - 平台补贴 + 运费 = 到手价
```

- [ ] **Step 5: Run tests and static checks**

```powershell
pnpm vitest run src/features/price/admin
pnpm lint
pnpm typecheck
```

- [ ] **Step 6: Commit and push**

```powershell
git add src/app/admin/prices src/features/price/admin
git commit -m "Build manual price management console"
git push
```

---

### Task 8: Add Builder Comparison, Trend, and Purchase Flow

**Files:**

- Create: `src/features/price/builder/PriceComparisonDialog.tsx`
- Create: `src/features/price/builder/PriceComparisonDialog.module.css`
- Create: `src/features/price/builder/PriceComparisonDialog.test.tsx`
- Create: `src/features/price/builder/PriceTrendChart.tsx`
- Modify: `src/features/engine/EngineDemo.tsx`
- Modify: `src/features/builder/components/BuildSummary.tsx`
- Modify: `src/features/builder/components/BuildSummary.module.css`
- Modify: `src/features/builder/components/ComponentSelector.tsx`
- Modify: `src/features/builder/components/ComponentSelector.module.css`

**Interfaces:**

- `EngineDemo` owns `priceOpen` state.
- `BuildSummary` receives `onOpenPrices(): void`.
- `ComponentSelector` receives `onOpenPrices(): void`.
- Dialog reads selected hardware from `builderStore` and fetches the active category.

- [ ] **Step 1: Write RED dialog tests**

Cover:

- default GPU selection;
- 7D/30D history switching;
- lowest and recommended IDs differ;
- stale and empty states;
- internal `/go` link target with `rel="noopener noreferrer"`;
- hardware selection change refetches.

- [ ] **Step 2: Build trend chart**

Use accessible inline SVG, no chart dependency. Expose min/max/current values as text and an `aria-label`.

- [ ] **Step 3: Build desktop modal and mobile sheet**

Desktop target 920×680. Mobile sheet keeps close, price summary, offer cards, chart, disclosure, and 44px purchase actions visible.

- [ ] **Step 4: Wire entry points**

Add `COMPARE PRICES` below total price on desktop and a price icon beside Smart Build/Save on mobile.

- [ ] **Step 5: Run tests and build**

```powershell
pnpm vitest run src/features/price/builder
pnpm lint
pnpm typecheck
pnpm build
```

- [ ] **Step 6: Commit and push**

```powershell
git add src/features/price/builder src/features/engine/EngineDemo.tsx src/features/builder/components
git commit -m "Connect Builder to live price comparison"
git push
```

---

### Task 9: Real Integration, Documentation, and Release

**Files:**

- Modify: `README.md`
- Modify: `DESIGN.md`
- Modify: `backend/.env.example`
- Modify: `docs/superpowers/specs/2026-07-31-pc-lab-price-intelligence-v1-design.md` status

- [ ] **Step 1: Run full backend verification**

```powershell
mvn -f backend/pom.xml verify
```

Expected: all tests pass and `hardware-platform-1.0.0.jar` packages.

- [ ] **Step 2: Run full frontend verification**

```powershell
pnpm verify
```

Expected: Biome, TypeScript, Vitest, and Next production build pass.

- [ ] **Step 3: Run real MySQL/Redis smoke**

Start local MySQL/Redis and the packaged backend. Verify:

1. V3 migrates the existing `pc_lab_3d` database;
2. legacy internal prices remain;
3. Admin creates a MANUAL product and offer;
4. public comparison returns lowest and recommended;
5. offer update appends history;
6. `/go` writes a click and returns a reviewed 302 target;
7. Redis invalidation exposes the new price immediately.

- [ ] **Step 4: Run browser QA**

Capture and inspect:

- Builder 1440×1024 comparison dialog;
- Builder 390×844 comparison sheet;
- Admin 1440×1024;
- Admin 390×844;
- empty, loading, save success, and price-history states.

Fix direct screenshot defects, recapture changed states, and check console logs.

- [ ] **Step 5: Update documentation**

Document Admin Key session flow, manual catalog workflow, all public/Admin endpoints, platform allowlists, scheduler mode, cache TTLs, and the no-crawler/no-live-API boundary.

- [ ] **Step 6: Commit and push**

```powershell
git add README.md DESIGN.md backend/.env.example docs
git commit -m "Document Price Intelligence V1 release"
git push
```

- [ ] **Step 7: Merge and tag**

After fresh verification:

```powershell
git switch main
git pull --ff-only origin main
git merge --ff-only agent/price-intelligence-v1
git tag -a price-intelligence-v1.0.0 -m "PC LAB 3D Price Intelligence V1.0.0"
git push origin main price-intelligence-v1.0.0
```

Expected: `main`, the release tag, and the local merged commit resolve to the same tree.
