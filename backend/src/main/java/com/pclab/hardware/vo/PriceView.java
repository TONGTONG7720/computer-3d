package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PriceView(
        Long id,
        String source,
        String seller,
        BigDecimal price,
        String currency,
        boolean inStock,
        String productUrl,
        LocalDateTime checkedAt
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
