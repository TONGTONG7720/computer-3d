package com.pclab.hardware.ai.recommendation;

import com.pclab.hardware.service.BuildMetricsCalculator.BuildMetrics;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AiBuildCandidate(
        Map<String, HardwareView> components,
        BuildMetrics metrics,
        int purposeScore,
        boolean overBudget,
        BigDecimal budgetVariance,
        List<ComponentChange> changedDependencies,
        List<Alternative> alternatives,
        List<String> unfulfilledPreferences
) {

    public AiBuildCandidate {
        components = Map.copyOf(components);
        changedDependencies = List.copyOf(changedDependencies);
        alternatives = List.copyOf(alternatives);
        unfulfilledPreferences = List.copyOf(unfulfilledPreferences);
    }

    public BigDecimal totalPrice() {
        return metrics.totalPrice();
    }

    public record ComponentChange(
            String category,
            String previousHardwareId,
            String selectedHardwareId
    ) {
    }

    public record Alternative(
            String label,
            BigDecimal totalPrice,
            int purposeScore,
            String tradeoff
    ) {
    }
}
