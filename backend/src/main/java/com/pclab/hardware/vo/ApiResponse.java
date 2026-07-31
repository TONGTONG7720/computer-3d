package com.pclab.hardware.vo;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import org.slf4j.MDC;

public record ApiResponse<T>(
        String code,
        String message,
        T data,
        String traceId,
        Instant timestamp
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("OK", "success", data, currentTraceId(), Instant.now());
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(code, message, null, currentTraceId(), Instant.now());
    }

    private static String currentTraceId() {
        String traceId = MDC.get("traceId");
        return traceId == null ? "" : traceId;
    }
}
