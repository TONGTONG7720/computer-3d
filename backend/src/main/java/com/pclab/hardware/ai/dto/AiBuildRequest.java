package com.pclab.hardware.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record AiBuildRequest(
        @NotBlank @Size(max = 2000) String message,
        @Pattern(
                regexp = "^[0-9a-fA-F-]{36}$",
                message = "sessionId 必须是 UUID"
        ) String sessionId,
        @Size(max = 8) Map<
                @Pattern(
                        regexp = "cpu|gpu|motherboard|ram|storage|cooling|power_supply|case"
                ) String,
                @NotBlank @Size(max = 80) String
                > currentComponents
) {

    public AiBuildRequest {
        currentComponents = currentComponents == null ? Map.of() : Map.copyOf(currentComponents);
    }
}
