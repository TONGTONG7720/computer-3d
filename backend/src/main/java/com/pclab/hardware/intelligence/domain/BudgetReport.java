package com.pclab.hardware.intelligence.domain;

import java.math.BigDecimal;

public record BudgetReport(
        Status status,
        BigDecimal limit,
        BigDecimal current,
        BigDecimal remaining,
        BigDecimal overage,
        BigDecimal utilizationPercent
) {

    public enum Status {
        WITHIN,
        NEAR_LIMIT,
        OVER
    }
}
