package com.pclab.hardware.intelligence.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BuildAnalysisRequest(
        @Min(0) long revision,
        @NotNull @DecimalMin("0.00") BigDecimal budget,
        @NotNull @Valid BuildComponentIds components
) {
}
