package com.pclab.hardware.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
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
}
