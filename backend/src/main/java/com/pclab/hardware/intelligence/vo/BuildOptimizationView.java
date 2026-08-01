package com.pclab.hardware.intelligence.vo;

import com.pclab.hardware.intelligence.domain.OptimizationGoal;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record BuildOptimizationView(
        long revision,
        OptimizationGoal goal,
        Map<String, String> recommendedComponents,
        BuildAnalysisView projectedAnalysis,
        List<SuggestionView> suggestions,
        BigDecimal priceDelta,
        int profileDelta,
        BigDecimal unresolvedBudget,
        boolean changed,
        String reason
) {

    public BuildOptimizationView {
        recommendedComponents = Map.copyOf(recommendedComponents);
        suggestions = List.copyOf(suggestions);
    }

    public record SuggestionView(
            String code,
            String title,
            String reason,
            Map<String, String> changes,
            BigDecimal priceDelta,
            int profileDelta,
            boolean applicable
    ) {

        public SuggestionView {
            changes = Map.copyOf(changes);
        }
    }
}
