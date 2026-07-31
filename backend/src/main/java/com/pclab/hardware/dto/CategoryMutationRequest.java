package com.pclab.hardware.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryMutationRequest(
        @NotBlank @Pattern(regexp = "[A-Z][A-Z0-9_]{1,31}") String code,
        @NotBlank @Size(max = 64) String name,
        @NotBlank @Pattern(regexp = "[a-z][a-z0-9_]{1,31}") String builderCategory,
        @NotNull @Min(0) Integer sortOrder
) {
}
