package com.pclab.hardware.intelligence.domain;

import java.math.BigDecimal;
import java.util.Map;

public record OptimizationSuggestion(
        String code,
        String title,
        String reason,
        Map<IntelligenceCategory, String> changes,
        BigDecimal priceDelta,
        int profileDelta,
        boolean applicable
) {

    public OptimizationSuggestion {
        changes = Map.copyOf(changes);
    }
}
