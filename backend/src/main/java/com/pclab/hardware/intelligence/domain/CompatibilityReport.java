package com.pclab.hardware.intelligence.domain;

import java.util.List;

public record CompatibilityReport(
        Status status,
        List<Issue> issues,
        int checkedRuleCount,
        int systemPowerWatt,
        int recommendedPsuWatt,
        List<IntelligenceCategory> missingCategories
) {

    public CompatibilityReport {
        issues = List.copyOf(issues);
        missingCategories = List.copyOf(missingCategories);
    }

    public enum Status {
        SUCCESS,
        WARNING,
        ERROR,
        INCOMPLETE
    }

    public record Issue(
            String ruleCode,
            CompatibilitySeverity severity,
            String message,
            List<String> componentIds,
            String expected,
            String actual
    ) {

        public Issue {
            componentIds = List.copyOf(componentIds);
        }
    }
}
