package com.pclab.hardware.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PriceUpdateRequest(
        @NotNull @DecimalMin("0") @DecimalMax("999999.99") BigDecimal price,
        @NotNull Boolean inStock,
        @NotBlank @Size(max = 120) String seller
) {
}
