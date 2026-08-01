package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

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

        Method cancel = PriceAlertService.class.getMethod(
                "cancel",
                String.class,
                String.class
        );
        assertHashedOwnerEviction(cancel.getAnnotation(CacheEvict.class));
    }

    @Test
    void clearsTheBatchCacheOnlyWhenSchedulerUpdatesRows() throws Exception {
        Method reevaluate = PriceAlertService.class.getMethod("reevaluateActiveAlerts");
        CacheEvict eviction = reevaluate.getAnnotation(CacheEvict.class);

        assertThat(eviction.cacheNames()).containsExactly("price-alerts");
        assertThat(eviction.allEntries()).isTrue();
        assertThat(eviction.beforeInvocation()).isFalse();
        assertThat(eviction.condition()).isEqualTo("#result > 0");
    }

    private static void assertHashedOwnerEviction(CacheEvict eviction) {
        assertThat(eviction.cacheNames()).containsExactly("price-alerts");
        assertThat(eviction.key()).isEqualTo(HASHED_OWNER_KEY);
        assertThat(eviction.beforeInvocation()).isFalse();
    }
}
