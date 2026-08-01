package com.pclab.hardware.price.vo;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PriceAlertView(
        String publicId,
        String hardwareKey,
        String hardwareName,
        BigDecimal targetPrice,
        BigDecimal currentBestPrice,
        String status,
        LocalDateTime triggeredAt,
        LocalDateTime checkedAt,
        LocalDateTime updatedAt
) implements Serializable {
}
