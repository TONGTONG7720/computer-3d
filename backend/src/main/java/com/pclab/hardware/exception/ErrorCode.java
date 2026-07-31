package com.pclab.hardware.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "请求参数不合法"),
    HARDWARE_NOT_FOUND(HttpStatus.NOT_FOUND, "硬件不存在"),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "硬件分类不存在"),
    BUILD_NOT_FOUND(HttpStatus.NOT_FOUND, "配置方案不存在"),
    UNAUTHORIZED_ADMIN(HttpStatus.UNAUTHORIZED, "Admin Key 无效"),
    CONFLICT(HttpStatus.CONFLICT, "数据已发生变化，请刷新后重试"),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "请求过于频繁"),
    STORAGE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "模型文件存储失败"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "服务暂时不可用");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
