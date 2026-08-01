package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
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
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.mockito.ArgumentCaptor;
import org.apache.ibatis.builder.MapperBuilderAssistant;

class PriceAlertServiceTest {

    private static final String HARDWARE_KEY = "gpu-nvidia-rtx5090";

    @BeforeAll
    static void initializeMybatisMetadata() {
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(
                new MybatisConfiguration(),
                "price-alert-test"
        );
        assistant.setCurrentNamespace("price-alert-test");
        TableInfoHelper.initTableInfo(assistant, PriceAlertEntity.class);
    }

    @Test
    void upsertsAnActiveAlertWithoutPassingOwnerPlaintextToTheMapper() {
        Fixture fixture = fixture("25000");
        String owner = UUID.randomUUID().toString();
        String ownerHash = fixture.hasher().hash(owner);
        when(fixture.mapper().selectOne(any())).thenAnswer(invocation -> {
            LambdaQueryWrapper<PriceAlertEntity> query = invocation.getArgument(0);
            query.getSqlSegment();
            assertThat(query.getParamNameValuePairs().values())
                    .contains(ownerHash)
                    .doesNotContain(owner);
            return null;
        });

        PriceAlertView result = fixture.service().upsert(
                owner,
                HARDWARE_KEY,
                new BigDecimal("20000")
        );

        assertThat(result.status()).isEqualTo("ACTIVE");
        assertThat(result.publicId()).isNotBlank().isNotEqualTo(owner);
        assertThat(result.currentBestPrice()).isEqualByComparingTo("25000");
        ArgumentCaptor<PriceAlertEntity> inserted = ArgumentCaptor.forClass(PriceAlertEntity.class);
        verify(fixture.mapper()).insert(inserted.capture());
        assertThat(inserted.getValue().getOwnerHash()).isEqualTo(ownerHash);
        assertThat(inserted.getValue().getOwnerHash()).doesNotContain(owner);
    }

    @Test
    void triggersImmediatelyWhenCurrentBestMeetsTheTarget() {
        Fixture fixture = fixture("20000");
        when(fixture.mapper().selectOne(any())).thenReturn(null);

        PriceAlertView result = fixture.service().upsert(
                UUID.randomUUID().toString(),
                HARDWARE_KEY,
                new BigDecimal("20000")
        );

        assertThat(result.status()).isEqualTo("TRIGGERED");
        assertThat(result.triggeredAt()).isNotNull();
    }

    @Test
    void updatesTheExistingOwnerHardwareAlertInsteadOfCreatingADuplicate() {
        Fixture fixture = fixture("25000");
        PriceAlertEntity existing = alert("alert-public-id", "ACTIVE", "22000");
        when(fixture.mapper().selectOne(any())).thenReturn(existing);

        PriceAlertView result = fixture.service().upsert(
                UUID.randomUUID().toString(),
                HARDWARE_KEY,
                new BigDecimal("20000")
        );

        assertThat(result.publicId()).isEqualTo("alert-public-id");
        assertThat(result.targetPrice()).isEqualByComparingTo("20000");
        verify(fixture.mapper()).updateById(existing);
        verify(fixture.mapper(), never()).insert(any(PriceAlertEntity.class));
    }

    @Test
    void refusesToCancelAnAlertOwnedByAnotherAnonymousOwner() {
        Fixture fixture = fixture("25000");
        when(fixture.mapper().selectOne(any())).thenReturn(null);

        assertThatThrownBy(() -> fixture.service().cancel(
                UUID.randomUUID().toString(),
                UUID.randomUUID().toString()
        )).isInstanceOf(DomainException.class)
                .extracting(error -> ((DomainException) error).errorCode())
                .isEqualTo(ErrorCode.PRICE_ALERT_NOT_FOUND);
        verify(fixture.mapper(), never()).updateById(any(PriceAlertEntity.class));
    }

    @Test
    void listsOnlyPublicAlertDataForTheHashedOwner() {
        Fixture fixture = fixture("25000");
        String owner = UUID.randomUUID().toString();
        PriceAlertEntity active = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        active.setCurrentBestPrice(new BigDecimal("25000"));
        when(fixture.mapper().selectList(any())).thenAnswer(invocation -> {
            LambdaQueryWrapper<PriceAlertEntity> query = invocation.getArgument(0);
            query.getSqlSegment();
            assertThat(query.getParamNameValuePairs().values())
                    .contains(fixture.hasher().hash(owner))
                    .doesNotContain(owner);
            return List.of(active);
        });

        List<PriceAlertView> result = fixture.service().list(owner);

        assertThat(result).singleElement().satisfies(view -> {
            assertThat(view.publicId()).isEqualTo(active.getPublicId());
            assertThat(view.hardwareKey()).isEqualTo(HARDWARE_KEY);
            assertThat(view.status()).isEqualTo("ACTIVE");
        });
    }

    @Test
    void cancellingAnOwnedAlertPausesIt() {
        Fixture fixture = fixture("25000");
        PriceAlertEntity active = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        when(fixture.mapper().selectOne(any())).thenReturn(active);

        fixture.service().cancel(UUID.randomUUID().toString(), active.getPublicId());

        assertThat(active.getStatus()).isEqualTo("PAUSED");
        verify(fixture.mapper()).updateById(active);
    }

    @Test
    void reevaluatesOnlyActiveAlertsAgainstTheLatestBestPrice() {
        Fixture fixture = fixture("19999");
        PriceAlertEntity active = alert(UUID.randomUUID().toString(), "ACTIVE", "20000");
        when(fixture.mapper().selectList(any())).thenReturn(List.of(active));

        fixture.service().reevaluateActiveAlerts();

        assertThat(active.getStatus()).isEqualTo("TRIGGERED");
        assertThat(active.getCurrentBestPrice()).isEqualByComparingTo("19999");
        assertThat(active.getTriggeredAt()).isNotNull();
        verify(fixture.mapper()).updateById(active);
    }

    @Test
    void schedulerReevaluatesActiveAlertsAfterTheCoverageRefresh() {
        HardwareMapper hardwareMapper = mock(HardwareMapper.class);
        PriceComparisonService comparisonService = mock(PriceComparisonService.class);
        PriceAlertService alertService = mock(PriceAlertService.class);
        when(hardwareMapper.selectList(any())).thenReturn(List.of());
        PriceRefreshScheduler scheduler = new PriceRefreshScheduler(
                hardwareMapper,
                comparisonService,
                alertService
        );

        scheduler.refreshHotHardwareCoverage();

        verify(alertService).reevaluateActiveAlerts();
    }

    private static Fixture fixture(String currentBestPrice) {
        HardwareQueryService hardwareService = mock(HardwareQueryService.class);
        PriceAlertMapper mapper = mock(PriceAlertMapper.class);
        PriceComparisonService comparisonService = mock(PriceComparisonService.class);
        HardwareEntity hardware = new HardwareEntity();
        hardware.setId(1L);
        hardware.setHardwareKey(HARDWARE_KEY);
        hardware.setName("NVIDIA GeForce RTX 5090");
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
                hasher
        );
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
        return new PriceComparisonView(
                HARDWARE_KEY,
                "NVIDIA GeForce RTX 5090",
                new BigDecimal("24999"),
                lowestPrice == null ? null : new BigDecimal(lowestPrice),
                null,
                null,
                "test",
                null,
                List.of(),
                "MANUAL",
                "人工维护",
                java.time.LocalDateTime.of(2026, 8, 2, 8, 0)
        );
    }

    private record Fixture(
            PriceAlertService service,
            PriceAlertMapper mapper,
            PriceAlertOwnerHasher hasher
    ) {
    }
}
