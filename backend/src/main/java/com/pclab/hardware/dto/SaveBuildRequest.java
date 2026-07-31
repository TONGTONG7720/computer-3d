package com.pclab.hardware.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record SaveBuildRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull
        @Size(min = 8, max = 8)
        @Valid
        Map<
                @Pattern(
                        regexp = "cpu|gpu|motherboard|ram|storage|cooling|power_supply|case"
                ) String,
                @NotBlank @Size(max = 80) String
                > components
) {
}
