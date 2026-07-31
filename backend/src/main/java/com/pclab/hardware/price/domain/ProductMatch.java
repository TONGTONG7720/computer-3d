package com.pclab.hardware.price.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductMatch(
        BigDecimal confidence,
        MatchDecision decision,
        Map<String, BigDecimal> dimensionScores,
        List<String> explanations
) {

    public ProductMatch {
        dimensionScores = Map.copyOf(dimensionScores);
        explanations = List.copyOf(explanations);
    }

    public enum MatchDecision {
        CONFIRMED,
        REVIEW_REQUIRED,
        REJECTED
    }
}
