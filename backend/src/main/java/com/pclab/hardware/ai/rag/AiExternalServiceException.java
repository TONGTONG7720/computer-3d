package com.pclab.hardware.ai.rag;

public class AiExternalServiceException extends RuntimeException {

    private final String code;

    public AiExternalServiceException(String code) {
        super(code);
        this.code = code;
    }

    public AiExternalServiceException(String code, Throwable cause) {
        super(code, cause);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
