package com.pclab.hardware.intelligence.domain;

import java.io.Serial;
import java.io.Serializable;

public record PerformanceProfile(
        int gaming,
        int creator,
        int ai,
        String source,
        int version
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public static PerformanceProfile baseline(int score) {
        return new PerformanceProfile(score, score, score, "PC LAB baseline", 1);
    }
}
