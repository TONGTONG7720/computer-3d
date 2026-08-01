package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.AnnotationCacheOperationSource;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.interceptor.CacheEvictOperation;
import org.springframework.cache.interceptor.CacheOperation;

class PriceAlertCacheContractTest {

    private static final String HASHED_OWNER_KEY =
            "@priceAlertOwnerHasher.hash(#ownerToken)";

    @Test
    void cachesListsAndEvictsMutationsByHashedOwnerOnly() throws Exception {
        Method list = PriceAlertService.class.getMethod("list", String.class);
        Cacheable cached = list.getAnnotation(Cacheable.class);
        assertThat(cached.cacheNames()).containsExactly("price-alerts");
        assertThat(cached.key()).isEqualTo(HASHED_OWNER_KEY);
        assertThat(cached.key()).isNotEqualTo("#ownerToken");

        Method upsert = PriceAlertService.class.getMethod(
                "upsert",
                String.class,
                String.class,
                BigDecimal.class
        );
        List<CacheEvictOperation> upsertEvictions = parsedEvictions(upsert);
        assertThat(upsertEvictions).hasSize(2);
        assertHashedOwnerEviction(evictionFor(upsertEvictions, "price-alerts"));
        assertDashboardEviction(evictionFor(upsertEvictions, "price-admin"), "");

        Method cancel = PriceAlertService.class.getMethod(
                "cancel",
                String.class,
                String.class
        );
        List<CacheEvictOperation> cancelEvictions = parsedEvictions(cancel);
        assertThat(cancelEvictions).hasSize(2);
        assertHashedOwnerEviction(evictionFor(cancelEvictions, "price-alerts"));
        assertDashboardEviction(evictionFor(cancelEvictions, "price-admin"), "");
    }

    @Test
    void clearsTheBatchCacheOnlyWhenSchedulerUpdatesRows() throws Exception {
        Method reevaluate = PriceAlertService.class.getMethod("reevaluateActiveAlerts");
        List<CacheEvictOperation> evictions = parsedEvictions(reevaluate);
        assertThat(evictions).hasSize(2);
        CacheEvictOperation ownerEviction = evictionFor(evictions, "price-alerts");

        assertThat(ownerEviction.getCacheNames()).containsExactly("price-alerts");
        assertThat(ownerEviction.isCacheWide()).isTrue();
        assertThat(ownerEviction.isBeforeInvocation()).isFalse();
        assertThat(ownerEviction.getKey()).isEmpty();
        assertThat(ownerEviction.getCondition()).isEqualTo("#result > 0");
        assertDashboardEviction(
                evictionFor(evictions, "price-admin"),
                "#result > 0"
        );
    }

    private static void assertHashedOwnerEviction(CacheEvictOperation eviction) {
        assertThat(eviction.getCacheNames()).containsExactly("price-alerts");
        assertThat(eviction.getKey()).isEqualTo(HASHED_OWNER_KEY);
        assertThat(eviction.getCondition()).isEmpty();
        assertThat(eviction.isCacheWide()).isFalse();
        assertThat(eviction.isBeforeInvocation()).isFalse();
    }

    private static void assertDashboardEviction(
            CacheEvictOperation eviction,
            String condition
    ) {
        assertThat(eviction.getCacheNames()).containsExactly("price-admin");
        assertThat(eviction.getKey()).isEqualTo("'dashboard'");
        assertThat(eviction.getCondition()).isEqualTo(condition);
        assertThat(eviction.isCacheWide()).isFalse();
        assertThat(eviction.isBeforeInvocation()).isFalse();
    }

    private static List<CacheEvictOperation> parsedEvictions(Method method) {
        Collection<CacheOperation> operations = new AnnotationCacheOperationSource()
                .getCacheOperations(method, PriceAlertService.class);
        assertThat(operations).isNotNull();
        assertThat(operations).allMatch(CacheEvictOperation.class::isInstance);
        return operations.stream()
                .map(CacheEvictOperation.class::cast)
                .toList();
    }

    private static CacheEvictOperation evictionFor(
            List<CacheEvictOperation> evictions,
            String cacheName
    ) {
        return evictions.stream()
                .filter(eviction -> eviction.getCacheNames().contains(cacheName))
                .findFirst()
                .orElseThrow();
    }
}
