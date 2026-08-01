package com.pclab.hardware.intelligence.domain;

import java.math.BigDecimal;

public record CompatibilityRuleConfig(
        int reserveWatt,
        BigDecimal headroomRatio,
        int roundingWatt
) {

    public static CompatibilityRuleConfig defaults() {
        return new CompatibilityRuleConfig(75, new BigDecimal("1.20"), 50);
    }
}
