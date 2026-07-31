package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

public record HardwareAdminView(
        Long id,
        String hardwareKey,
        String name,
        String brand,
        String category,
        BigDecimal price,
        int performance,
        int power,
        String status,
        int version
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
