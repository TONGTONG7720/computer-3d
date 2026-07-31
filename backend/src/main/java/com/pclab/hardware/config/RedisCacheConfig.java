package com.pclab.hardware.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis", matchIfMissing = true)
public class RedisCacheConfig implements CachingConfigurer {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisCacheConfig.class);
    private static final String KEY_PREFIX = "pclab:v1:cache::";

    @Bean
    CacheManager redisCacheManager(
            RedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper
    ) {
        RedisSerializer<Object> valueSerializer = redisValueSerializer(objectMapper);
        RedisCacheConfiguration defaults = cacheConfiguration(
                Duration.ofMinutes(5),
                valueSerializer
        );
        Map<String, RedisCacheConfiguration> configurations = Map.ofEntries(
                Map.entry("hardware-list", cacheConfiguration(Duration.ofMinutes(5), valueSerializer)),
                Map.entry("hardware-detail", cacheConfiguration(Duration.ofMinutes(15), valueSerializer)),
                Map.entry("categories", cacheConfiguration(Duration.ofHours(1), valueSerializer)),
                Map.entry("hardware-models", cacheConfiguration(Duration.ofMinutes(30), valueSerializer)),
                Map.entry("prices", cacheConfiguration(Duration.ofMinutes(2), valueSerializer)),
                Map.entry("builds", cacheConfiguration(Duration.ofMinutes(30), valueSerializer)),
                Map.entry("price-comparison", cacheConfiguration(Duration.ofMinutes(5), valueSerializer)),
                Map.entry("price-history", cacheConfiguration(Duration.ofMinutes(15), valueSerializer)),
                Map.entry("price-build", cacheConfiguration(Duration.ofMinutes(2), valueSerializer)),
                Map.entry("price-hot", cacheConfiguration(Duration.ofMinutes(10), valueSerializer)),
                Map.entry("price-admin", cacheConfiguration(Duration.ofMinutes(1), valueSerializer))
        );
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(configurations)
                .transactionAware()
                .build();
    }

    @Override
    @Bean
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                logCacheFailure("get", cache, key, exception);
            }

            @Override
            public void handleCachePutError(
                    RuntimeException exception,
                    Cache cache,
                    Object key,
                    Object value
            ) {
                logCacheFailure("put", cache, key, exception);
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                logCacheFailure("evict", cache, key, exception);
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                logCacheFailure("clear", cache, "*", exception);
            }
        };
    }

    static RedisSerializer<Object> redisValueSerializer(ObjectMapper objectMapper) {
        return GenericJackson2JsonRedisSerializer.builder()
                .objectMapper(objectMapper.copy())
                .defaultTyping(true)
                .build();
    }

    private static RedisCacheConfiguration cacheConfiguration(
            Duration ttl,
            RedisSerializer<Object> valueSerializer
    ) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(ttl)
                .disableCachingNullValues()
                .computePrefixWith(cacheName -> KEY_PREFIX + cacheName + "::")
                .serializeKeysWith(SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(SerializationPair.fromSerializer(valueSerializer));
    }

    private static void logCacheFailure(
            String operation,
            Cache cache,
            Object key,
            RuntimeException exception
    ) {
        LOGGER.warn(
                "Redis cache {} failed for cache={} key={}; falling back to database ({})",
                operation,
                cache.getName(),
                key,
                exception.getClass().getSimpleName()
        );
    }
}
