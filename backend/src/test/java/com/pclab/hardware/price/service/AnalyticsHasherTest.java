package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.price.config.PriceProperties;
import org.junit.jupiter.api.Test;

class AnalyticsHasherTest {

    @Test
    void hashesBlankAnalyticsValuesInsteadOfPersistingAnEmptyValue() {
        PriceProperties properties = new PriceProperties();
        properties.setAnalyticsHashKey("test-hash-key");

        String hash = new AnalyticsHasher(properties).hash("");

        assertThat(hash).matches("[0-9a-f]{64}");
    }
}
