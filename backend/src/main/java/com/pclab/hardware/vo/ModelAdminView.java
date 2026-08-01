package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

public record ModelAdminView(
        Long id,
        Long hardwareId,
        String name,
        String glbUrl,
        BigDecimal scaleX,
        BigDecimal scaleY,
        BigDecimal scaleZ,
        BigDecimal positionX,
        BigDecimal positionY,
        BigDecimal positionZ,
        BigDecimal rotationX,
        BigDecimal rotationY,
        BigDecimal rotationZ,
        String animationConfig,
        int lodLevel,
        boolean primary,
        String status,
        long fileSizeBytes,
        String checksumSha256
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
