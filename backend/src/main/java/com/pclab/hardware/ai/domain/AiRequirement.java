package com.pclab.hardware.ai.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

public record AiRequirement(
        BigDecimal budget,
        Set<Purpose> purposes,
        Set<Priority> priorities,
        Set<Style> styles,
        FormFactorPreference formFactor,
        Map<ComponentTarget, String> requestedChanges,
        double confidence,
        List<String> missingInformation
) {

    public AiRequirement {
        purposes = Set.copyOf(purposes);
        priorities = Set.copyOf(priorities);
        styles = Set.copyOf(styles);
        requestedChanges = Map.copyOf(requestedChanges);
        missingInformation = List.copyOf(missingInformation);
        if (confidence < 0 || confidence > 1) {
            throw new IllegalArgumentException("confidence must be between 0 and 1");
        }
    }

    public enum Purpose {
        GAMING,
        OFFICE,
        DESIGN,
        PROGRAMMING,
        AI_TRAINING
    }

    public enum Priority {
        GPU,
        CPU,
        QUIET,
        VALUE
    }

    public enum Style {
        WHITE,
        RGB
    }

    public enum FormFactorPreference {
        ANY,
        COMPACT
    }

    public enum ComponentTarget {
        CPU,
        GPU
    }
}
