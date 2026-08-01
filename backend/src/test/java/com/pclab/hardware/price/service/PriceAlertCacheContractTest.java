package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;

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
        assertHashedOwnerEviction(upsert.getAnnotation(CacheEvict.class));
        assertDashboardEviction(upsert, "");

        Method cancel = PriceAlertService.class.getMethod(
                "cancel",
                String.class,
                String.class
        );
        assertHashedOwnerEviction(cancel.getAnnotation(CacheEvict.class));
        assertDashboardEviction(cancel, "");
    }

    @Test
    void clearsTheBatchCacheOnlyWhenSchedulerUpdatesRows() throws Exception {
        Method reevaluate = PriceAlertService.class.getMethod("reevaluateActiveAlerts");
        CacheEvict eviction = reevaluate.getAnnotation(CacheEvict.class);

        assertThat(eviction.cacheNames()).containsExactly("price-alerts");
        assertThat(eviction.allEntries()).isTrue();
        assertThat(eviction.beforeInvocation()).isFalse();
        assertThat(eviction.condition()).isEqualTo("#result > 0");
        assertDashboardEviction(reevaluate, "#result > 0");
    }

    private static void assertHashedOwnerEviction(CacheEvict eviction) {
        assertThat(eviction.cacheNames()).containsExactly("price-alerts");
        assertThat(eviction.key()).isEqualTo(HASHED_OWNER_KEY);
        assertThat(eviction.beforeInvocation()).isFalse();
    }

    private static void assertDashboardEviction(Method method, String condition) {
        Caching caching = method.getAnnotation(Caching.class);
        assertThat(caching).isNotNull();
        assertThat(caching.evict()).singleElement().satisfies(eviction -> {
            assertThat(eviction.cacheNames()).containsExactly("price-admin");
            assertThat(eviction.key()).isEqualTo("'dashboard'");
            assertThat(eviction.condition()).isEqualTo(condition);
            assertThat(eviction.beforeInvocation()).isFalse();
        });
    }
}
