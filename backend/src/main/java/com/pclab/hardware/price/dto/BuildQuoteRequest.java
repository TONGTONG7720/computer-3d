package com.pclab.hardware.price.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BuildQuoteRequest(
        @NotEmpty
        @Size(max = 8)
        List<@NotBlank @Size(max = 160) String> hardwareKeys
) {

    public BuildQuoteRequest {
        hardwareKeys = hardwareKeys == null ? null : List.copyOf(hardwareKeys);
    }
}
