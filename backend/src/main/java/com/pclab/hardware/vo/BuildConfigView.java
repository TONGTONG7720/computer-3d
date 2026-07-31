package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record BuildConfigView(
        String publicId,
        String name,
        Map<String, String> components,
        List<HardwareView> hardware,
        BigDecimal totalPrice,
        int performanceScore,
        int powerUsageWatt,
        String compatibilityStatus,
        LocalDateTime createdAt
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
