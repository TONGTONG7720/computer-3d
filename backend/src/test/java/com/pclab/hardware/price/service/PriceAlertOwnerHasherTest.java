package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.price.config.PriceProperties;
import org.junit.jupiter.api.Test;

class PriceAlertOwnerHasherTest {

    private static final String OWNER = "123e4567-e89b-12d3-a456-426614174000";

    @Test
    void matchesTheIndependentSaltedDomainSeparatedSha256Vector() {
        PriceProperties properties = properties("test-price-alert-hash-key");

        String hash = new PriceAlertOwnerHasher(properties).hash(OWNER);

        assertThat(hash).isEqualTo(
                "927ab6145fb717cb44985bb6ac8e1884669e0e18e1841d85b2f4ad4f07390327"
        );
        assertThat(hash).isNotEqualTo(new AnalyticsHasher(properties).hash(OWNER));
        assertThat(hash).isNotEqualTo(
                new PriceAlertOwnerHasher(properties("different-alert-hash-key")).hash(OWNER)
        );
    }

    private static PriceProperties properties(String salt) {
        PriceProperties properties = new PriceProperties();
        properties.setAnalyticsHashKey(salt);
        return properties;
    }
}
