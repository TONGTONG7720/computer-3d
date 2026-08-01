package com.pclab.hardware.intelligence.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HardwarePerformanceUpdateRequest(
        @Min(0) @Max(100) int gaming,
        @Min(0) @Max(100) int creator,
        @Min(0) @Max(100) int ai,
        @NotBlank @Size(max = 80) String source,
        @Min(0) int version
) {
}
