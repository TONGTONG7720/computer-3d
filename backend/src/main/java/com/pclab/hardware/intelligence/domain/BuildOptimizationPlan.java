package com.pclab.hardware.intelligence.domain;

import java.math.BigDecimal;
import java.util.List;

public record BuildOptimizationPlan(
        BuildSelection selection,
        List<OptimizationSuggestion> suggestions,
        BigDecimal unresolvedBudget,
        boolean changed
) {

    public BuildOptimizationPlan {
        suggestions = List.copyOf(suggestions);
    }
}
