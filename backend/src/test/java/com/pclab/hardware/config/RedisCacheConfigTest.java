package com.pclab.hardware.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.price.entity.PriceAlertEntity;
import com.pclab.hardware.price.mapper.PriceAlertMapper;
import com.pclab.hardware.price.service.PriceAlertOwnerHasher;
import com.pclab.hardware.price.service.PriceAlertService;
import com.pclab.hardware.price.service.PriceComparisonService;
import com.pclab.hardware.price.vo.PriceAlertView;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.BuildConfigView;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.transaction.TransactionAwareCacheDecorator;
import org.springframework.data.redis.cache.RedisCache;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializer;

class RedisCacheConfigTest {

    @Test
    void configuresTransactionAwareTwoMinutePriceAlertCache() {
        RedisCacheManager manager = (RedisCacheManager) new RedisCacheConfig()
                .redisCacheManager(
                        mock(RedisConnectionFactory.class),
                        new ObjectMapper().findAndRegisterModules()
        );
        manager.afterPropertiesSet();

        Cache cache = manager.getCache("price-alerts");
        assertThat(cache).isInstanceOf(TransactionAwareCacheDecorator.class);
        Cache targetCache = ((TransactionAwareCacheDecorator) cache).getTargetCache();
        assertThat(targetCache).isInstanceOf(RedisCache.class);
        RedisCache priceAlerts = (RedisCache) targetCache;
        assertThat(priceAlerts.getCacheConfiguration().getTtlFunction().getTimeToLive("key", "value"))
                .isEqualTo(Duration.ofMinutes(2));
    }

    @Test
    void serializesBuildsContainingJavaTimeValues() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        BuildConfigView build = new BuildConfigView(
                "build-id",
                "测试配置",
                Map.of("cpu", "cpu-id"),
                List.of(),
                BigDecimal.valueOf(8999),
                88,
                650,
                "SUCCESS",
                LocalDateTime.of(2026, 7, 31, 10, 30)
        );

        assertThatCode(() -> RedisCacheConfig.redisValueSerializer(objectMapper).serialize(build))
                .doesNotThrowAnyException();
    }

    @Test
    void roundTripsThePriceAlertListProducedByTheService() {
        String ownerToken = "123e4567-e89b-12d3-a456-426614174000";
        String ownerHash = "a".repeat(64);
        HardwareQueryService hardwareService = mock(HardwareQueryService.class);
        PriceAlertMapper alertMapper = mock(PriceAlertMapper.class);
        PriceAlertOwnerHasher ownerHasher = mock(PriceAlertOwnerHasher.class);
        HardwareEntity hardware = new HardwareEntity();
        hardware.setId(1L);
        hardware.setHardwareKey("gpu-nvidia-rtx5090");
        hardware.setName("GeForce RTX 5090");
        LocalDateTime checkedAt = LocalDateTime.of(2026, 8, 2, 2, 30);
        PriceAlertEntity alert = new PriceAlertEntity();
        alert.setPublicId("11111111-1111-1111-1111-111111111111");
        alert.setHardwareId(1L);
        alert.setTargetPrice(new BigDecimal("19999.00"));
        alert.setCurrentBestPrice(new BigDecimal("18999.00"));
        alert.setStatus("TRIGGERED");
        alert.setTriggeredAt(checkedAt);
        alert.setCheckedAt(checkedAt);
        alert.setUpdatedAt(checkedAt);
        when(ownerHasher.hash(ownerToken)).thenReturn(ownerHash);
        when(alertMapper.selectVisibleByOwnerHash(ownerHash)).thenReturn(List.of(alert));
        when(hardwareService.requireHardware("1")).thenReturn(hardware);
        PriceAlertService alertService = new PriceAlertService(
                hardwareService,
                alertMapper,
                mock(PriceComparisonService.class),
                ownerHasher
        );
        List<PriceAlertView> alerts = alertService.list(ownerToken);
        RedisSerializer<Object> serializer = RedisCacheConfig.redisValueSerializer(
                new ObjectMapper().findAndRegisterModules()
        );

        Object restored = serializer.deserialize(serializer.serialize(alerts));

        assertThat(restored).isInstanceOf(List.class);
        List<?> restoredAlerts = (List<?>) restored;
        assertThat(restoredAlerts).hasSize(1);
        assertThat(restoredAlerts.getFirst()).isInstanceOf(PriceAlertView.class);
        PriceAlertView restoredAlert = (PriceAlertView) restoredAlerts.getFirst();
        assertThat(restoredAlert.publicId()).isEqualTo(alert.getPublicId());
        assertThat(restoredAlert.hardwareKey()).isEqualTo(hardware.getHardwareKey());
        assertThat(restoredAlert.targetPrice()).isEqualByComparingTo("19999.00");
        assertThat(restoredAlert.status()).isEqualTo("TRIGGERED");
        assertThat(restoredAlert.updatedAt()).isEqualTo(checkedAt);
    }
}
