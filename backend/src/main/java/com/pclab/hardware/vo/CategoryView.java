package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;

public record CategoryView(
        String code,
        String name,
        String builderCategory,
        int sortOrder
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
