package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

public record HardwareModelView(
        Long id,
        String name,
        String glbUrl,
        String textureUrl,
        String previewUrl,
        Vector3 scale,
        Vector3 position,
        Vector3 rotation,
        int lodLevel,
        long fileSizeBytes,
        String checksumSha256,
        boolean primary,
        String status
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public record Vector3(BigDecimal x, BigDecimal y, BigDecimal z) implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;
    }
}
