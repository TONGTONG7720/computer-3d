package com.pclab.hardware.intelligence.vo;

import java.time.LocalDateTime;

public record HardwarePerformanceView(
        Long hardwareId,
        int gaming,
        int creator,
        int ai,
        String source,
        int version,
        LocalDateTime measuredAt
) {
}
