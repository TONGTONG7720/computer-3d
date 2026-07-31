package com.pclab.hardware.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record HardwareMutationRequest(
        @NotBlank
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*")
        @Size(max = 80)
        String hardwareKey,
        @NotBlank @Size(max = 160) String name,
        @NotBlank @Size(max = 80) String brand,
        @NotBlank @Pattern(regexp = "[A-Z][A-Z0-9_]{1,31}") String category,
        @Size(max = 1000) String description,
        @NotNull @DecimalMin("0") @DecimalMax("999999.99") BigDecimal price,
        @NotNull @Min(0) @Max(100) Integer performance,
        @NotNull @Min(0) @Max(5000) Integer power,
        @Size(max = 500) String modelUrl,
        @Size(max = 80) String modelVariant,
        @Size(max = 500) String coverUrl,
        @NotNull @Min(0) Integer sortOrder,
        @NotBlank @Pattern(regexp = "DRAFT|ACTIVE|ARCHIVED") String status,
        @Min(1) Integer version,
        @NotNull JsonNode specification
) {
}
