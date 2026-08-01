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
    PRICE_OFFER_NOT_FOUND(HttpStatus.NOT_FOUND, "报价不存在"),
    PRICE_PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "商品不存在"),
    PRICE_RECORD_READ_ONLY(HttpStatus.CONFLICT, "内部参考资料只读，不能通过价格后台修改"),
    PRICE_PROMOTION_INVALID(HttpStatus.BAD_REQUEST, "优惠金额不合法"),
    PRICE_REDIRECT_BLOCKED(HttpStatus.BAD_REQUEST, "购买链接未通过安全校验"),
    PRICE_RANGE_INVALID(HttpStatus.BAD_REQUEST, "价格趋势范围仅支持 7D、30D 或 90D"),
    PRICE_ALERT_NOT_FOUND(HttpStatus.NOT_FOUND, "价格提醒不存在"),
    PRICE_ADAPTER_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "价格平台适配器未启用或暂时不可用"),
    AI_RECOMMENDATION_UNAVAILABLE(HttpStatus.UNPROCESSABLE_ENTITY, "当前硬件目录无法生成兼容配置"),
    AI_RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "AI 管理资源不存在"),
    AI_VECTOR_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "向量知识库未启用或暂时不可用"),
    AI_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "智能装机服务暂时不可用"),
    INTELLIGENCE_RULE_NOT_FOUND(HttpStatus.NOT_FOUND, "兼容规则不存在"),
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
