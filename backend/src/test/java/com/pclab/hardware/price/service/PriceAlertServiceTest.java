package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.HardwareMapper;
import com.pclab.hardware.price.config.PriceProperties;
import com.pclab.hardware.price.entity.PriceAlertEntity;
import com.pclab.hardware.price.mapper.PriceAlertMapper;
import com.pclab.hardware.price.scheduler.PriceRefreshScheduler;
import com.pclab.hardware.price.vo.PriceAlertView;
import com.pclab.hardware.price.vo.PriceComparisonView;
import com.pclab.hardware.service.HardwareQueryService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

class PriceAlertServiceTest {

    private static final String HARDWARE_KEY = "gpu-nvidia-rtx5090";

    @Test
    void atomicallyUpsertsAnActiveAlertWithoutPassingOwnerPlaintextToTheMapper() {
        Fixture fixture = fixture("25000");
        String owner = UUID.randomUUID().toString();
        String ownerHash = fixture.hasher().hash(owner);
        PriceAlertEntity persisted = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        persisted.setCurrentBestPrice(new BigDecimal("25000"));
        when(fixture.mapper().selectByOwnerHashAndHardwareId(ownerHash, 1L))
                .thenReturn(persisted);

        PriceAlertView result = fixture.service().upsert(
                owner,
                HARDWARE_KEY,
                new BigDecimal("20000")
        );

        assertThat(result.status()).isEqualTo("ACTIVE");
        assertThat(result.publicId()).isEqualTo(persisted.getPublicId());
        ArgumentCaptor<PriceAlertEntity> upserted = ArgumentCaptor.forClass(PriceAlertEntity.class);
        verify(fixture.mapper()).upsertAlert(upserted.capture());
        assertThat(upserted.getValue().getOwnerHash()).isEqualTo(ownerHash);
        assertThat(upserted.getValue().getOwnerHash()).doesNotContain(owner);
        assertThat(upserted.getValue().getStatus()).isEqualTo("ACTIVE");
        verify(fixture.mapper(), never()).selectOne(any());
        verify(fixture.mapper(), never()).insert(any(PriceAlertEntity.class));
        verify(fixture.mapper(), never()).updateById(any(PriceAlertEntity.class));
    }

    @Test
    void triggersImmediatelyWhenCurrentBestMeetsTheTarget() {
        Fixture fixture = fixture("20000");
        String owner = UUID.randomUUID().toString();
        String ownerHash = fixture.hasher().hash(owner);
        PriceAlertEntity persisted = alert(UUID.randomUUID().toString(), "TRIGGERED", "20000");
        persisted.setCurrentBestPrice(new BigDecimal("20000"));
        persisted.setTriggeredAt(LocalDateTime.of(2026, 8, 2, 8, 0));
        when(fixture.mapper().selectByOwnerHashAndHardwareId(ownerHash, 1L))
                .thenReturn(persisted);

        PriceAlertView result = fixture.service().upsert(
                owner,
                HARDWARE_KEY,
                new BigDecimal("20000")
        );

        assertThat(result.status()).isEqualTo("TRIGGERED");
        ArgumentCaptor<PriceAlertEntity> upserted = ArgumentCaptor.forClass(PriceAlertEntity.class);
        verify(fixture.mapper()).upsertAlert(upserted.capture());
        assertThat(upserted.getValue().getStatus()).isEqualTo("TRIGGERED");
        assertThat(upserted.getValue().getTriggeredAt()).isNotNull();
    }

    @Test
    void returnsThePublicIdPreservedByTheDatabaseUpsert() {
        Fixture fixture = fixture("25000");
        String owner = UUID.randomUUID().toString();
        String ownerHash = fixture.hasher().hash(owner);
        PriceAlertEntity persisted = alert("existing-public-id", "ACTIVE", "20000");
        when(fixture.mapper().selectByOwnerHashAndHardwareId(ownerHash, 1L))
                .thenReturn(persisted);

        PriceAlertView result = fixture.service().upsert(
                owner,
                HARDWARE_KEY,
                new BigDecimal("20000")
        );

        assertThat(result.publicId()).isEqualTo("existing-public-id");
        verify(fixture.mapper()).upsertAlert(any(PriceAlertEntity.class));
        verify(fixture.mapper(), never()).insert(any(PriceAlertEntity.class));
    }

    @Test
    void refusesToCancelAnAlertWhenTheOwnedConditionalUpdateChangesNoRow() {
        Fixture fixture = fixture("25000");
        String owner = UUID.randomUUID().toString();
        String publicId = UUID.randomUUID().toString();
        String ownerHash = fixture.hasher().hash(owner);
        when(fixture.mapper().pauseOwnedAlert(
                eq(ownerHash),
                eq(publicId),
                any(LocalDateTime.class)
        )).thenReturn(0);

        assertThatThrownBy(() -> fixture.service().cancel(owner, publicId))
                .isInstanceOf(DomainException.class)
                .extracting(error -> ((DomainException) error).errorCode())
                .isEqualTo(ErrorCode.PRICE_ALERT_NOT_FOUND);
        verify(fixture.mapper(), never()).selectOne(any());
        verify(fixture.mapper(), never()).updateById(any(PriceAlertEntity.class));
    }

    @Test
    void cancelsUsingOwnerHashAndPublicIdInOneMapperCall() {
        Fixture fixture = fixture("25000");
        String owner = UUID.randomUUID().toString();
        String publicId = UUID.randomUUID().toString();
        String ownerHash = fixture.hasher().hash(owner);
        when(fixture.mapper().pauseOwnedAlert(
                eq(ownerHash),
                eq(publicId),
                any(LocalDateTime.class)
        )).thenReturn(1);

        fixture.service().cancel(owner, publicId);

        verify(fixture.mapper()).pauseOwnedAlert(
                eq(ownerHash),
                eq(publicId),
                any(LocalDateTime.class)
        );
        verify(fixture.mapper(), never()).selectOne(any());
    }

    @Test
    void listsPublicAlertsUsingOnlyTheHashedOwner() {
        Fixture fixture = fixture("25000");
        String owner = UUID.randomUUID().toString();
        String ownerHash = fixture.hasher().hash(owner);
        PriceAlertEntity active = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        active.setCurrentBestPrice(new BigDecimal("25000"));
        when(fixture.mapper().selectVisibleByOwnerHash(ownerHash)).thenReturn(List.of(active));

        List<PriceAlertView> result = fixture.service().list(owner);

        assertThat(result).singleElement().satisfies(view -> {
            assertThat(view.publicId()).isEqualTo(active.getPublicId());
            assertThat(view.hardwareKey()).isEqualTo(HARDWARE_KEY);
            assertThat(view.status()).isEqualTo("ACTIVE");
        });
        verify(fixture.mapper()).selectVisibleByOwnerHash(ownerHash);
    }

    @Test
    void reevaluatesWithActiveAndExpectedTargetConditions() {
        Fixture fixture = fixture("19999");
        PriceAlertEntity active = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        when(fixture.mapper().selectActiveAlerts()).thenReturn(List.of(active));
        when(fixture.mapper().updateIfStillActive(
                any(PriceAlertEntity.class),
                eq(new BigDecimal("20000"))
        )).thenReturn(1);

        int updated = fixture.service().reevaluateActiveAlerts();

        assertThat(updated).isEqualTo(1);
        ArgumentCaptor<PriceAlertEntity> update = ArgumentCaptor.forClass(PriceAlertEntity.class);
        verify(fixture.mapper()).updateIfStillActive(
                update.capture(),
                eq(new BigDecimal("20000"))
        );
        assertThat(update.getValue().getStatus()).isEqualTo("TRIGGERED");
        assertThat(update.getValue().getCurrentBestPrice()).isEqualByComparingTo("19999");
        verify(fixture.mapper(), never()).updateById(any(PriceAlertEntity.class));
    }

    @Test
    void isolatesOneAlertFailureAndContinuesTheBatch() {
        Fixture fixture = fixture("19999");
        PriceAlertEntity failed = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        failed.setHardwareId(1L);
        PriceAlertEntity successful = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        successful.setId(11L);
        successful.setHardwareId(2L);
        HardwareEntity secondHardware = hardware(2L, "gpu-amd-rx9900");
        when(fixture.hardwareService().requireHardware("2")).thenReturn(secondHardware);
        when(fixture.comparisonService().compareHardware(HARDWARE_KEY))
                .thenThrow(new IllegalStateException("first alert failed"));
        when(fixture.comparisonService().compareHardware("gpu-amd-rx9900"))
                .thenReturn(comparison("19999", "gpu-amd-rx9900"));
        when(fixture.mapper().selectActiveAlerts()).thenReturn(List.of(failed, successful));
        when(fixture.mapper().updateIfStillActive(
                any(PriceAlertEntity.class),
                eq(new BigDecimal("20000"))
        )).thenReturn(1);

        int updated = fixture.service().reevaluateActiveAlerts();

        assertThat(updated).isEqualTo(1);
        verify(fixture.mapper()).updateIfStillActive(
                org.mockito.ArgumentMatchers.argThat(alert -> alert.getId().equals(11L)),
                eq(new BigDecimal("20000"))
        );
    }

    @Test
    void hourlySchedulerChecksCoverageBeforeReevaluatingAlerts() {
        HardwareMapper hardwareMapper = mock(HardwareMapper.class);
        PriceComparisonService comparisonService = mock(PriceComparisonService.class);
        PriceAlertService alertService = mock(PriceAlertService.class);
        HardwareEntity hardware = hardware(1L, HARDWARE_KEY);
        when(hardwareMapper.selectList(any())).thenReturn(List.of(hardware));
        when(comparisonService.compareHardware(HARDWARE_KEY)).thenReturn(comparison("25000"));
        PriceRefreshScheduler scheduler = new PriceRefreshScheduler(
                hardwareMapper,
                comparisonService,
                alertService
        );

        scheduler.refreshHotHardwareCoverage();

        InOrder order = inOrder(comparisonService, alertService);
        order.verify(comparisonService).compareHardware(HARDWARE_KEY);
        order.verify(alertService).reevaluateActiveAlerts();
    }

    @Test
    void dailySchedulerDoesNotRepeatTheFullAlertScan() {
        HardwareMapper hardwareMapper = mock(HardwareMapper.class);
        PriceComparisonService comparisonService = mock(PriceComparisonService.class);
        PriceAlertService alertService = mock(PriceAlertService.class);
        when(hardwareMapper.selectList(any())).thenReturn(List.of());
        PriceRefreshScheduler scheduler = new PriceRefreshScheduler(
                hardwareMapper,
                comparisonService,
                alertService
        );

        scheduler.refreshNormalHardwareCoverage();

        verify(alertService, never()).reevaluateActiveAlerts();
    }

    private static Fixture fixture(String currentBestPrice) {
        HardwareQueryService hardwareService = mock(HardwareQueryService.class);
        PriceAlertMapper mapper = mock(PriceAlertMapper.class);
        PriceComparisonService comparisonService = mock(PriceComparisonService.class);
        HardwareEntity hardware = hardware(1L, HARDWARE_KEY);
        when(hardwareService.requireHardware(HARDWARE_KEY)).thenReturn(hardware);
        when(hardwareService.requireHardware("1")).thenReturn(hardware);
        when(comparisonService.compareHardware(HARDWARE_KEY))
                .thenReturn(comparison(currentBestPrice));
        PriceProperties properties = new PriceProperties();
        properties.setAnalyticsHashKey("test-price-alert-hash-key");
        PriceAlertOwnerHasher hasher = new PriceAlertOwnerHasher(properties);
        return new Fixture(
                new PriceAlertService(hardwareService, mapper, comparisonService, hasher),
                mapper,
                hasher,
                hardwareService,
                comparisonService
        );
    }

    private static HardwareEntity hardware(Long id, String hardwareKey) {
        HardwareEntity hardware = new HardwareEntity();
        hardware.setId(id);
        hardware.setHardwareKey(hardwareKey);
        hardware.setName(hardwareKey);
        return hardware;
    }

    private static PriceAlertEntity alert(String publicId, String status, String targetPrice) {
        PriceAlertEntity alert = new PriceAlertEntity();
        alert.setId(10L);
        alert.setPublicId(publicId);
        alert.setOwnerHash("owner-hash");
        alert.setHardwareId(1L);
        alert.setTargetPrice(new BigDecimal(targetPrice));
        alert.setStatus(status);
        return alert;
    }

    private static PriceComparisonView comparison(String lowestPrice) {
        return comparison(lowestPrice, HARDWARE_KEY);
    }

    private static PriceComparisonView comparison(String lowestPrice, String hardwareKey) {
        return new PriceComparisonView(
                hardwareKey,
                hardwareKey,
                new BigDecimal("24999"),
                lowestPrice == null ? null : new BigDecimal(lowestPrice),
                null,
                null,
                "test",
                null,
                List.of(),
                "MANUAL",
                "人工维护",
                LocalDateTime.of(2026, 8, 2, 8, 0)
        );
    }

    private record Fixture(
            PriceAlertService service,
            PriceAlertMapper mapper,
            PriceAlertOwnerHasher hasher,
            HardwareQueryService hardwareService,
            PriceComparisonService comparisonService
    ) {
    }
}
