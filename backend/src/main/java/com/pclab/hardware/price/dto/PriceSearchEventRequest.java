package com.pclab.hardware.price.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PriceSearchEventRequest(
        @NotBlank @Size(max = 160) String keyword,
        @Size(max = 32) String categoryCode,
        @Min(0) @Max(10000) int resultCount,
        @Size(max = 80) String sessionId,
        @NotBlank @Pattern(regexp = "BUILDER|EXPLORER|DETAIL") String sourceSurface
) {
}
