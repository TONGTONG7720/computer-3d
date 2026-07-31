package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;

public record ModelAdminView(
        Long id,
        Long hardwareId,
        String glbUrl,
        int lodLevel,
        boolean primary,
        String status,
        long fileSizeBytes,
        String checksumSha256
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
