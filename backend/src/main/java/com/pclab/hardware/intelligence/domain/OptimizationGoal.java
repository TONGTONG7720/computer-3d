package com.pclab.hardware.intelligence.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum OptimizationGoal {
    BALANCED,
    GAMING,
    CREATOR,
    AI;

    @JsonCreator
    public static OptimizationGoal fromJson(String value) {
        if (value == null) {
            return null;
        }
        return OptimizationGoal.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    @JsonValue
    public String toJson() {
        return name().toLowerCase(Locale.ROOT);
    }

    public int score(PerformanceReport report) {
        return switch (this) {
            case BALANCED -> report.overall();
            case GAMING -> report.gaming().score();
            case CREATOR -> report.creator().score();
            case AI -> report.ai().score();
        };
    }
}
