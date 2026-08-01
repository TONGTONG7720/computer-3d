package com.pclab.hardware.intelligence.domain;

import java.math.BigDecimal;

public record HardwareFacts(
        String id,
        String name,
        String brand,
        IntelligenceCategory category,
        BigDecimal price,
        int powerWatt,
        PerformanceProfile performance,
        ComponentSpecification specification,
        String modelUrl,
        String modelVariant
) {
}
