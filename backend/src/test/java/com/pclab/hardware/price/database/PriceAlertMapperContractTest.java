package com.pclab.hardware.price.database;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.price.entity.PriceAlertEntity;
import com.pclab.hardware.price.mapper.PriceAlertMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest(properties = "app.price.scheduler-enabled=false")
class PriceAlertMapperContractTest {

    private static final String OWNER_HASH = "a".repeat(64);
    private static final LocalDateTime FIRST_CHECK = LocalDateTime.of(2026, 8, 2, 8, 0);

    @Autowired
    private PriceAlertMapper mapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void createPriceAlertTable() {
        jdbcTemplate.execute("DROP TABLE IF EXISTS price_alert");
        jdbcTemplate.execute("""
                CREATE TABLE price_alert (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    public_id VARCHAR(36) NOT NULL UNIQUE,
                    owner_hash CHAR(64) NOT NULL,
                    hardware_id BIGINT NOT NULL,
                    target_price DECIMAL(12,2) NOT NULL,
                    current_best_price DECIMAL(12,2),
                    status VARCHAR(20) NOT NULL,
                    triggered_at TIMESTAMP(3),
                    checked_at TIMESTAMP(3),
                    created_at TIMESTAMP(3) NOT NULL,
                    updated_at TIMESTAMP(3) NOT NULL,
                    UNIQUE (owner_hash, hardware_id)
                )
                """);
    }

    @AfterEach
    void dropPriceAlertTable() {
        jdbcTemplate.execute("DROP TABLE IF EXISTS price_alert");
    }

    @Test
    void nativeUpsertPreservesPublicIdAndAppliesLastWriteWins() {
        PriceAlertEntity first = alert("11111111-1111-1111-1111-111111111111", "100", "TRIGGERED");
        first.setTriggeredAt(FIRST_CHECK);
        PriceAlertEntity second = alert("22222222-2222-2222-2222-222222222222", "80", "TRIGGERED");
        second.setTriggeredAt(FIRST_CHECK.plusHours(1));

        assertThat(mapper.upsertAlert(first)).isPositive();
        assertThat(mapper.upsertAlert(second)).isPositive();

        PriceAlertEntity persisted = mapper.selectByOwnerHashAndHardwareId(OWNER_HASH, 7L);
        assertThat(persisted.getPublicId()).isEqualTo(first.getPublicId());
        assertThat(persisted.getTargetPrice()).isEqualByComparingTo("80");
        assertThat(persisted.getTriggeredAt()).isEqualTo(FIRST_CHECK);
        assertThat(mapper.selectCount(null)).isEqualTo(1L);
    }

    @Test
    void concurrentFirstUpsertsProduceOneRowWithoutDuplicateKeyFailure() throws Exception {
        PriceAlertEntity first = alert("11111111-1111-1111-1111-111111111111", "100", "ACTIVE");
        PriceAlertEntity second = alert("22222222-2222-2222-2222-222222222222", "80", "ACTIVE");
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> firstResult = executor.submit(() -> upsertAfterGate(first, ready, start));
            Future<Integer> secondResult = executor.submit(() -> upsertAfterGate(second, ready, start));
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            assertThat(firstResult.get(10, TimeUnit.SECONDS)).isPositive();
            assertThat(secondResult.get(10, TimeUnit.SECONDS)).isPositive();
        } finally {
            executor.shutdownNow();
        }

        PriceAlertEntity persisted = mapper.selectByOwnerHashAndHardwareId(OWNER_HASH, 7L);
        assertThat(persisted.getPublicId()).isIn(first.getPublicId(), second.getPublicId());
        assertThat(persisted.getTargetPrice()).isIn(
                new BigDecimal("100.00"),
                new BigDecimal("80.00")
        );
        assertThat(mapper.selectCount(null)).isEqualTo(1L);
    }

    @Test
    void ownerScopedPausePreventsAStaleActiveRefresh() {
        PriceAlertEntity active = alert("11111111-1111-1111-1111-111111111111", "100", "ACTIVE");
        mapper.upsertAlert(active);
        PriceAlertEntity snapshot = mapper.selectByOwnerHashAndHardwareId(OWNER_HASH, 7L);

        assertThat(mapper.pauseOwnedAlert(
                "b".repeat(64),
                active.getPublicId(),
                FIRST_CHECK.plusMinutes(1)
        )).isZero();
        assertThat(mapper.pauseOwnedAlert(
                OWNER_HASH,
                active.getPublicId(),
                FIRST_CHECK.plusMinutes(1)
        )).isEqualTo(1);
        prepareTriggeredRefresh(snapshot);

        assertThat(mapper.updateIfStillActive(snapshot, new BigDecimal("100"))).isZero();
        PriceAlertEntity persisted = mapper.selectByOwnerHashAndHardwareId(OWNER_HASH, 7L);
        assertThat(persisted.getStatus()).isEqualTo("PAUSED");
        assertThat(persisted.getCurrentBestPrice()).isEqualByComparingTo("120");
    }

    @Test
    void targetChangePreventsARefreshFromAnOlderSnapshot() {
        PriceAlertEntity original = alert("11111111-1111-1111-1111-111111111111", "100", "ACTIVE");
        mapper.upsertAlert(original);
        PriceAlertEntity staleSnapshot = mapper.selectByOwnerHashAndHardwareId(OWNER_HASH, 7L);
        PriceAlertEntity changedTarget = alert(
                "22222222-2222-2222-2222-222222222222",
                "80",
                "ACTIVE"
        );
        mapper.upsertAlert(changedTarget);
        prepareTriggeredRefresh(staleSnapshot);

        assertThat(mapper.updateIfStillActive(
                staleSnapshot,
                new BigDecimal("100")
        )).isZero();
        PriceAlertEntity persisted = mapper.selectByOwnerHashAndHardwareId(OWNER_HASH, 7L);
        assertThat(persisted.getTargetPrice()).isEqualByComparingTo("80");
        assertThat(persisted.getStatus()).isEqualTo("ACTIVE");
    }

    private int upsertAfterGate(
            PriceAlertEntity alert,
            CountDownLatch ready,
            CountDownLatch start
    ) throws InterruptedException {
        ready.countDown();
        assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
        return mapper.upsertAlert(alert);
    }

    private static PriceAlertEntity alert(String publicId, String target, String status) {
        PriceAlertEntity alert = new PriceAlertEntity();
        alert.setPublicId(publicId);
        alert.setOwnerHash(OWNER_HASH);
        alert.setHardwareId(7L);
        alert.setTargetPrice(new BigDecimal(target));
        alert.setCurrentBestPrice(new BigDecimal("120"));
        alert.setStatus(status);
        alert.setCheckedAt(FIRST_CHECK);
        alert.setCreatedAt(FIRST_CHECK);
        alert.setUpdatedAt(FIRST_CHECK);
        return alert;
    }

    private static void prepareTriggeredRefresh(PriceAlertEntity alert) {
        alert.setCurrentBestPrice(new BigDecimal("90"));
        alert.setStatus("TRIGGERED");
        alert.setTriggeredAt(FIRST_CHECK.plusMinutes(2));
        alert.setCheckedAt(FIRST_CHECK.plusMinutes(2));
        alert.setUpdatedAt(FIRST_CHECK.plusMinutes(2));
    }
}
