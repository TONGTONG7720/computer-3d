package com.pclab.hardware.price.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PriceAlertRequest(
        @NotNull
        @DecimalMin("0.01")
        @DecimalMax("9999999.99")
        BigDecimal targetPrice
) {
}
