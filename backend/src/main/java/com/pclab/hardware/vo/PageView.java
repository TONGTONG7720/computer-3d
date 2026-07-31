package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

public record PageView<T>(
        long page,
        long size,
        long total,
        long totalPages,
        List<T> items
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
