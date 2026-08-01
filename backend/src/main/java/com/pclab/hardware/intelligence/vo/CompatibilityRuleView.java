package com.pclab.hardware.intelligence.vo;

import com.pclab.hardware.intelligence.domain.CompatibilityRuleConfig;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleType;
import com.pclab.hardware.intelligence.domain.CompatibilitySeverity;
import java.time.LocalDateTime;

public record CompatibilityRuleView(
        Long id,
        String code,
        String sourceCategory,
        String targetCategory,
        CompatibilityRuleType type,
        CompatibilitySeverity severity,
        String message,
        CompatibilityRuleConfig config,
        int priority,
        boolean enabled,
        int version,
        LocalDateTime updatedAt
) {
}
