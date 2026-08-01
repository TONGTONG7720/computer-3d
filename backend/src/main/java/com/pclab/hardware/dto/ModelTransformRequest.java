package com.pclab.hardware.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ModelTransformRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull @DecimalMin("0.00001") @DecimalMax("1000") BigDecimal scaleX,
        @NotNull @DecimalMin("0.00001") @DecimalMax("1000") BigDecimal scaleY,
        @NotNull @DecimalMin("0.00001") @DecimalMax("1000") BigDecimal scaleZ,
        @NotNull BigDecimal positionX,
        @NotNull BigDecimal positionY,
        @NotNull BigDecimal positionZ,
        @NotNull BigDecimal rotationX,
        @NotNull BigDecimal rotationY,
        @NotNull BigDecimal rotationZ,
        @NotNull @Min(0) Integer lodLevel,
        @NotNull Boolean primary,
        @NotBlank @Pattern(regexp = "PROCESSING|READY|FAILED") String status,
        @Size(max = 4000) String animationConfig
) {
}
