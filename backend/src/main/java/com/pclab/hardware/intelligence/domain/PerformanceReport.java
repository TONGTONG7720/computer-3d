package com.pclab.hardware.intelligence.domain;

import java.util.List;

public record PerformanceReport(
        Profile gaming,
        Profile creator,
        Profile ai,
        int overall,
        boolean complete
) {

    public record Profile(int score, List<Contribution> contributions) {

        public Profile {
            contributions = List.copyOf(contributions);
        }
    }

    public record Contribution(
            IntelligenceCategory category,
            int inputScore,
            double weight,
            double weightedScore
    ) {
    }
}
