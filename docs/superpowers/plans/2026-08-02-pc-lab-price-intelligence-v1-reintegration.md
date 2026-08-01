# PC LAB 3D Price Intelligence V1.0 Reintegration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reintegrate the existing tested price domain with the current Hardware Intelligence Builder and complete 90-day history, explainable 40/25/15/10/10 ranking, anonymous price alerts, manual commerce administration, and secure purchase tracking.

**Architecture:** Keep Price Intelligence inside the Spring Boot modular monolith and evolve the existing V3/V4 schema with an additive V7 migration. The Next.js Builder consumes typed public APIs through isolated price hooks; failures degrade to internal reference prices without blocking hardware selection or the Three.js viewport.

**Tech Stack:** Java 21, Spring Boot 3.5, MyBatis Plus, MySQL, Redis, Flyway, Next.js 16, React 19, TypeScript, Zod, Zustand, Framer Motion, Vitest.

## Global Constraints

- PC LAB is a hardware purchase intelligence tool, not a storefront; do not add cart, checkout, payment, order, fulfillment, or promotional urgency patterns.
- V1 uses manually maintained quotes only and MUST NOT scrape websites or call JD, Taobao, or PDD alliance APIs.
- Public demo data MUST remain labelled `MANUAL_DEMO`; verified manual data uses `MANUAL`.
- Lowest price and recommended purchase MUST be distinct fields and labels.
- Ranking weights are exact: price 40%, seller trust 25%, sales 15%, rating 10%, logistics 10%.
- Price history supports exact API values `7D`, `30D`, and `90D`.
- Anonymous alert owner tokens never enter URLs or database plaintext; the server stores only a salted SHA-256 digest.
- Purchase URLs require HTTPS and an allow-listed platform host; successful redirects record anonymized click events.
- Preserve all existing hardware, product, offer, history, and internal reference price data.
- Keep AI and community code untouched except for compilation compatibility; do not start AI optimization work.
- Desktop, tablet, and mobile acceptance widths are 1440, 1024, and 390 pixels.

---

## File Structure

### Backend additions

- `backend/src/main/resources/db/migration/V7__complete_price_intelligence.sql`: additive price schema and alert migration.
- `backend/src/main/java/com/pclab/hardware/price/entity/PriceAlertEntity.java`: alert persistence model.
- `backend/src/main/java/com/pclab/hardware/price/mapper/PriceAlertMapper.java`: MyBatis alert access.
- `backend/src/main/java/com/pclab/hardware/price/dto/PriceAlertRequest.java`: target price validation.
- `backend/src/main/java/com/pclab/hardware/price/vo/PriceAlertView.java`: public alert contract.
- `backend/src/main/java/com/pclab/hardware/price/service/PriceAlertOwnerHasher.java`: owner-token hashing.
- `backend/src/main/java/com/pclab/hardware/price/service/PriceAlertService.java`: alert lifecycle.
- `backend/src/main/java/com/pclab/hardware/price/adapter/JdAllianceAdapter.java`: disabled-until-configured JD boundary.
- `backend/src/main/java/com/pclab/hardware/price/adapter/TaobaoAllianceAdapter.java`: disabled-until-configured Taobao boundary.
- `backend/src/main/java/com/pclab/hardware/price/adapter/PddOpenPlatformAdapter.java`: disabled-until-configured PDD boundary.

### Frontend additions

- `src/features/price/builder/useBuildQuote.ts`: revision-safe build quote state.
- `src/features/price/builder/BuildPriceSummary.tsx`: internal/lowest/recommended/savings summary.
- `src/features/price/builder/BuildPriceSummary.module.css`: compact Builder card.
- `src/features/price/builder/PriceAlertControl.tsx`: target price lifecycle UI.
- `src/features/price/builder/PriceAlertControl.module.css`: alert form/status.
- `src/features/price/builder/priceAlertOwner.ts`: local anonymous owner token.

Existing price, Builder, and admin files are modified in place because they already own those responsibilities.

---

### Task 1: Additive price schema and persistence contracts

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__complete_price_intelligence.sql`
- Create: `backend/src/main/java/com/pclab/hardware/price/entity/PriceAlertEntity.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/mapper/PriceAlertMapper.java`
- Modify: `backend/src/main/java/com/pclab/hardware/entity/ProductPriceEntity.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/entity/ProductEntity.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/database/PriceIntelligenceV7MigrationContractTest.java`

**Interfaces:**
- Produces: `PriceAlertEntity`, `PriceAlertMapper`, `deliveryScore`, `deliveryNote`, and `imageFingerprint` persistence fields.
- Preserves: all V3/V4/V6 data and constraints.

- [ ] **Step 1: Write the failing migration contract test**

```java
@Test
void createsLogisticsPrivacyAndAnonymousAlertContracts() throws IOException {
    String sql = Files.readString(Path.of(
            "src/main/resources/db/migration/V7__complete_price_intelligence.sql"
    ));
    assertThat(sql).contains(
            "ADD COLUMN delivery_score DECIMAL(5,2)",
            "ADD COLUMN delivery_note VARCHAR(160)",
            "ADD COLUMN image_fingerprint VARCHAR(128)",
            "CREATE TABLE price_alert",
            "owner_hash CHAR(64)",
            "UNIQUE KEY uk_price_alert_owner_hardware"
    );
    assertThat(sql).doesNotContain("DROP TABLE product", "DROP TABLE product_price");
}
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `mvn -f backend/pom.xml -Dtest=PriceIntelligenceV7MigrationContractTest test`

Expected: FAIL because V7 does not exist.

- [ ] **Step 3: Implement the additive migration and entities**

The migration must add `delivery_score DECIMAL(5,2) NOT NULL DEFAULT 70`,
`delivery_note VARCHAR(160) NOT NULL DEFAULT ''`, product `image_fingerprint`, anonymized event columns,
and `price_alert`. `PriceAlertEntity` exposes:

```java
@Data
@TableName("price_alert")
public class PriceAlertEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String publicId;
    private String ownerHash;
    private Long hardwareId;
    private BigDecimal targetPrice;
    private BigDecimal currentBestPrice;
    private String status;
    private LocalDateTime triggeredAt;
    private LocalDateTime checkedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 4: Run focused and existing migration tests**

Run: `mvn -f backend/pom.xml -Dtest=PriceIntelligenceV7MigrationContractTest,PriceMigrationContractTest test`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add backend/src/main/resources/db/migration/V7__complete_price_intelligence.sql backend/src/main/java/com/pclab/hardware/price/entity backend/src/main/java/com/pclab/hardware/price/mapper backend/src/main/java/com/pclab/hardware/entity/ProductPriceEntity.java backend/src/test/java/com/pclab/hardware/price/database
git commit -m "Extend the price intelligence schema"
```

### Task 2: Explainable matching, platform boundaries, and purchase ranking

**Files:**
- Modify: `backend/src/main/java/com/pclab/hardware/price/algorithm/ProductMatchingEngine.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/domain/ProductMatch.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/algorithm/BestPriceAlgorithm.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/domain/PriceRanking.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/adapter/PlatformAdapter.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/adapter/ManualCatalogAdapter.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/adapter/JdAllianceAdapter.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/adapter/TaobaoAllianceAdapter.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/adapter/PddOpenPlatformAdapter.java`
- Modify: `backend/src/main/resources/application.yml`
- Test: `backend/src/test/java/com/pclab/hardware/price/algorithm/ProductMatchingEngineTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/algorithm/BestPriceAlgorithmTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/adapter/PlatformAdapterRegistryTest.java`

**Interfaces:**
- `ProductMatchingEngine.match(String title, String imageFingerprint, HardwareView candidate)` returns dimension keys `model`, `brand`, `spec`, `keyword`, and `image`.
- `RankableOffer` gains `deliveryScore`; `ScoredOffer` gains `deliveryScore` contribution.
- `PlatformAdapter` gains `getSeller(PlatformProductRef)` and `getLink(PlatformProductRef)`.

- [ ] **Step 1: Add failing matching and ranking tests**

```java
assertThat(match.dimensionScores()).containsKeys("model", "brand", "spec", "keyword", "image");
assertThat(ranking.orderedOffers().getFirst().deliveryScore()).isEqualByComparingTo("10.00");
assertThat(ranking.recommended().id()).isEqualTo(highTrustFastDelivery.id());
```

Also assert accessory titles are rejected and all alliance adapters are disabled without credentials.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `mvn -f backend/pom.xml -Dtest=ProductMatchingEngineTest,BestPriceAlgorithmTest,PlatformAdapterRegistryTest test`

Expected: FAIL for missing dimensions, delivery score, and adapter methods.

- [ ] **Step 3: Implement exact scoring contracts**

Use normalized weighted scores:

```java
BigDecimal total = price.multiply(new BigDecimal("0.40"))
        .add(trust.multiply(new BigDecimal("0.25")))
        .add(sales.multiply(new BigDecimal("0.15")))
        .add(rating.multiply(new BigDecimal("0.10")))
        .add(delivery.multiply(new BigDecimal("0.10")));
```

Matching uses 45/20/20/10/5 and renormalizes when image evidence is absent. JD/Taobao/PDD adapters return `isEnabled=false` until both enabled configuration and credentials are present; their data methods fail with `PRICE_ADAPTER_UNAVAILABLE` rather than fake data.

- [ ] **Step 4: Run focused tests**

Run: `mvn -f backend/pom.xml -Dtest=ProductMatchingEngineTest,BestPriceAlgorithmTest,PlatformAdapterRegistryTest test`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add backend/src/main/java/com/pclab/hardware/price backend/src/main/resources/application.yml backend/src/test/java/com/pclab/hardware/price
git commit -m "Upgrade price matching and purchase ranking"
```

### Task 3: Complete public APIs, 90-day history, privacy, and alerts

**Files:**
- Create: `backend/src/main/java/com/pclab/hardware/price/dto/PriceAlertRequest.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/vo/PriceAlertView.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/service/PriceAlertOwnerHasher.java`
- Create: `backend/src/main/java/com/pclab/hardware/price/service/PriceAlertService.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/controller/PriceIntelligenceController.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/vo/PriceHistoryView.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/vo/BuildQuoteView.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/service/PriceComparisonService.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/service/PriceEventService.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/service/ClickRedirectService.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/scheduler/PriceRefreshScheduler.java`
- Modify: `backend/src/main/java/com/pclab/hardware/exception/ErrorCode.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/PriceAlertServiceTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/controller/PriceIntelligenceControllerTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/PriceHistoryServiceTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/ClickRedirectServiceTest.java`

**Interfaces:**
- `BuildQuoteView` gains `internalTotal` and `savings`.
- `HistoryRange` gains `NINETY_DAYS("90D", 90)`.
- `PriceAlertService.upsert(String ownerToken, String hardwareKey, BigDecimal targetPrice)` returns `PriceAlertView`.
- Public alert endpoints require `X-Price-Alert-Owner` matching UUID syntax.

- [ ] **Step 1: Write failing service and MVC tests**

```java
assertThat(HistoryRange.from("90D").days()).isEqualTo(90);
assertThat(service.upsert(owner, "gpu-nvidia-rtx5090", new BigDecimal("20000")).status())
        .isEqualTo("ACTIVE");
mockMvc.perform(put("/api/price-intelligence/alerts/gpu-nvidia-rtx5090")
        .header("X-Price-Alert-Owner", owner)
        .contentType(APPLICATION_JSON)
        .content("{\"targetPrice\":20000}"))
        .andExpect(status().isOk());
```

Test that owner plaintext is never passed to the mapper and unapproved redirect hosts do not write clicks.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `mvn -f backend/pom.xml -Dtest=PriceAlertServiceTest,PriceIntelligenceControllerTest,PriceHistoryServiceTest,ClickRedirectServiceTest test`

Expected: FAIL for missing alert and 90D contracts.

- [ ] **Step 3: Implement lifecycle and API**

`PriceAlertRequest` is:

```java
public record PriceAlertRequest(
        @NotNull @DecimalMin("0.01") @DecimalMax("9999999.99") BigDecimal targetPrice
) {}
```

Upsert by owner hash and hardware, refresh current best price, set `TRIGGERED` when `currentBest <= target`, and return only public IDs. Scheduler reevaluates ACTIVE alerts after quote refresh. Build quote computes `savings = max(0, internalTotal - lowestTotal)`.

- [ ] **Step 4: Run focused tests**

Run: `mvn -f backend/pom.xml -Dtest=PriceAlertServiceTest,PriceIntelligenceControllerTest,PriceHistoryServiceTest,ClickRedirectServiceTest,PriceComparisonServiceTest test`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add backend/src/main/java/com/pclab/hardware/price backend/src/main/java/com/pclab/hardware/exception backend/src/test/java/com/pclab/hardware/price
git commit -m "Complete price alerts and public intelligence APIs"
```

### Task 4: Extend manual administration for logistics and alert coverage

**Files:**
- Modify: `backend/src/main/java/com/pclab/hardware/price/dto/AdminPriceRequests.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/vo/AdminPriceViews.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/service/AdminOfferService.java`
- Modify: `backend/src/main/java/com/pclab/hardware/price/service/AdminPriceDashboardService.java`
- Modify: `src/features/price/domain/adminPrice.ts`
- Modify: `src/features/price/admin/OfferTrustFields.tsx`
- Modify: `src/features/price/admin/AdminWorkspaceOverview.tsx`
- Modify: `src/features/price/admin/OfferEditor.tsx`
- Test: `backend/src/test/java/com/pclab/hardware/price/service/AdminOfferServiceTest.java`
- Test: `backend/src/test/java/com/pclab/hardware/price/controller/AdminPriceControllerTest.java`
- Test: `src/features/price/admin/ProductEditorOfferFlow.test.tsx`

**Interfaces:**
- `UpsertOfferRequest` and `AdminOffer` gain `deliveryScore` and `deliveryNote`.
- Admin dashboard gains `activeAlertCount` and `triggeredAlertCount`.

- [ ] **Step 1: Write failing DTO/service/UI tests**

Assert that logistics score outside 0–100 is rejected, saved scores round-trip, dashboard shows alert coverage, and the editor submits `{ deliveryScore: 92, deliveryNote: "京东物流 · 次日达" }`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run backend: `mvn -f backend/pom.xml -Dtest=AdminOfferServiceTest,AdminPriceControllerTest test`

Run frontend: `pnpm vitest run src/features/price/admin/ProductEditorOfferFlow.test.tsx`

Expected: FAIL for missing logistics and alert metrics.

- [ ] **Step 3: Implement admin contracts and form controls**

Add server validation:

```java
@NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal deliveryScore,
@Size(max = 160) String deliveryNote
```

The UI uses a numeric 0–100 control and plain logistics description. Do not add shipping promises that were not entered by an administrator.

- [ ] **Step 4: Run focused tests**

Run both commands from Step 2; expected PASS.

- [ ] **Step 5: Commit**

```text
git add backend/src/main/java/com/pclab/hardware/price backend/src/test/java/com/pclab/hardware/price src/features/price/admin src/features/price/domain/adminPrice.ts
git commit -m "Extend manual price operations"
```

### Task 5: Reconnect typed price intelligence to the V3 Builder

**Files:**
- Modify: `src/features/price/domain/price.ts`
- Modify: `src/features/price/api/PriceApiClient.ts`
- Modify: `src/features/price/api/PriceApiClient.test.ts`
- Create: `src/features/price/builder/useBuildQuote.ts`
- Create: `src/features/price/builder/BuildPriceSummary.tsx`
- Create: `src/features/price/builder/BuildPriceSummary.module.css`
- Modify: `src/features/build/BuildPanel.tsx`
- Modify: `src/features/build/BuildPanel.test.tsx`
- Modify: `src/features/builder/workspace/BuilderWorkspace.tsx`
- Modify: `src/features/builder/workspace/BuilderWorkspace.test.tsx`
- Modify: `src/features/price/builder/PriceComparisonDialog.tsx`
- Modify: `src/features/price/builder/PriceComparisonDialog.test.tsx`

**Interfaces:**
- `PriceComparisonDialog` consumes `SelectedComponents` as a prop; it does not read the legacy global store.
- `useBuildQuote(hardwareKeys)` ignores stale responses after hardware selection changes.
- `BuildPriceSummary` accepts quote status and `onOpenPrices`.

- [ ] **Step 1: Write failing contract and integration tests**

```tsx
expect(await screen.findByText("最低购买")).toBeTruthy();
expect(screen.getByText("可节省 ¥1,400")).toBeTruthy();
await user.click(screen.getByRole("button", { name: "查看购买方案" }));
expect(screen.getByRole("dialog", { name: /价格智能/ })).toBeTruthy();
```

Add a deferred-promise test proving an older build quote cannot overwrite a newer hardware selection.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm vitest run src/features/price/api/PriceApiClient.test.ts src/features/build/BuildPanel.test.tsx src/features/builder/workspace/BuilderWorkspace.test.tsx src/features/price/builder/PriceComparisonDialog.test.tsx`

Expected: FAIL because the V3 Builder has no price intelligence entry.

- [ ] **Step 3: Implement typed quote state and workspace integration**

Build keys from selected non-null components, lazy-load the dialog, and keep Three.js isolated. The summary state shape is:

```ts
type BuildQuoteState = {
  readonly quote: BuildQuote | null;
  readonly status: "idle" | "loading" | "success" | "error";
  readonly retry: () => void;
};
```

On error, render internal reference price plus “平台报价暂不可用”; never block Builder interactions.

- [ ] **Step 4: Run focused tests**

Run the Step 2 command; expected PASS.

- [ ] **Step 5: Commit**

```text
git add src/features/price src/features/build src/features/builder/workspace
git commit -m "Connect Builder to purchase intelligence"
```

### Task 6: Add 90-day trends and anonymous price-alert UI

**Files:**
- Modify: `src/features/price/domain/price.ts`
- Modify: `src/features/price/api/PriceApiClient.ts`
- Create: `src/features/price/builder/priceAlertOwner.ts`
- Create: `src/features/price/builder/PriceAlertControl.tsx`
- Create: `src/features/price/builder/PriceAlertControl.module.css`
- Modify: `src/features/price/builder/PriceComparisonContent.tsx`
- Modify: `src/features/price/builder/PriceTrendChart.tsx`
- Modify: `src/features/price/builder/PriceHistoryPanel.module.css`
- Modify: `src/features/price/builder/PriceOfferCard.tsx`
- Modify: `src/features/price/builder/PriceOfferCard.module.css`
- Modify: `src/features/price/builder/PriceComparisonShell.module.css`
- Test: `src/features/price/api/PriceApiClient.test.ts`
- Test: `src/features/price/builder/PriceComparisonDialog.test.tsx`
- Test: `src/features/price/builder/PriceAlertControl.test.tsx`

**Interfaces:**
- `PriceRange` becomes `"7D" | "30D" | "90D"`.
- `getOrCreatePriceAlertOwner()` returns a stable UUID from local storage.
- Price alert API methods always send `X-Price-Alert-Owner` and never place the owner in query params.

- [ ] **Step 1: Write failing API and interaction tests**

Assert 90D is requested, an alert can be created/updated/deleted, owner tokens are header-only, triggered state is rendered, and the target input has a visible label and mobile-safe control height.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm vitest run src/features/price/api/PriceApiClient.test.ts src/features/price/builder/PriceComparisonDialog.test.tsx src/features/price/builder/PriceAlertControl.test.tsx`

Expected: FAIL for missing alert and 90D UI.

- [ ] **Step 3: Implement alerts, trend range, and trust presentation**

Create the owner using `crypto.randomUUID()` and key `pc-lab-price-alert-owner-v1`. The control renders `ACTIVE`, `TRIGGERED`, and empty states. Offer cards distinguish `推荐购买`, `最低到手`, `待核验`, show logistics evidence, and keep the external action copy `查看购买`.

- [ ] **Step 4: Run focused tests**

Run the Step 2 command; expected PASS.

- [ ] **Step 5: Commit**

```text
git add src/features/price
git commit -m "Add price trends and target alerts"
```

### Task 7: Production verification, documentation, and release hardening

**Files:**
- Modify: `README.md`
- Modify: `DESIGN.md`
- Modify: `backend/.env.example`
- Modify: `.env.example`
- Modify: only price/Builder files required by concrete review findings.

**Interfaces:**
- Documents routes `/builder`, `/admin/prices`, public price APIs, manual-data disclosure, and alliance credential fail-closed behavior.
- Produces no AI, community, cart, or payment feature.

- [ ] **Step 1: Run all static and automated verification**

```text
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
mvn -f backend/pom.xml test
```

Expected: all commands exit 0.

- [ ] **Step 2: Run real MySQL/Redis integration**

Start Redis, package and start Spring Boot on 8088, start Next production on 3000, and verify:

```text
GET /actuator/health -> UP
GET /api/price-intelligence/hardware/gpu-nvidia-rtx5090 -> offers + ranking
GET .../history?range=90D -> 90D contract
PUT /api/price-intelligence/alerts/gpu-nvidia-rtx5090 -> public alert
POST /api/price-intelligence/build/quote -> internalTotal + savings
GET /builder -> 200
GET /admin/prices -> 200
```

- [ ] **Step 3: Perform responsive visual QA**

Capture fresh 1440, 1024, and 390 screenshots for Builder price summary, Price Panel, alert states, and Admin quote editor. Verify no page-level horizontal overflow, 44px mobile actions, readable Chinese typography, focus visibility, explicit manual-data disclosure, and no storefront visual language.

- [ ] **Step 4: Fix concrete findings and repeat affected gates**

Use TDD for behavioral defects. Re-capture screenshots after visual changes and require independent visual review PASS.

- [ ] **Step 5: Update docs and commit release hardening**

```text
git add README.md DESIGN.md .env.example backend/.env.example <reviewed-fix-files>
git commit -m "Polish and verify Price Intelligence V1"
```

- [ ] **Step 6: Tag and push after verification**

```text
git push origin codex/price-intelligence-v1
git tag -a pc-lab-price-intelligence-v1.0.0 -m "PC LAB 3D Price Intelligence V1.0"
git push origin pc-lab-price-intelligence-v1.0.0
```
