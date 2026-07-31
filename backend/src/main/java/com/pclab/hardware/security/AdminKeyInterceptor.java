package com.pclab.hardware.security;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminKeyInterceptor implements HandlerInterceptor {

    public static final String ADMIN_KEY_HEADER = "X-Admin-Key";

    private final SecurityProperties properties;

    public AdminKeyInterceptor(SecurityProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String configuredKey = properties.getAdminKey();
        String submittedKey = request.getHeader(ADMIN_KEY_HEADER);
        if (configuredKey == null
                || configuredKey.isBlank()
                || submittedKey == null
                || !constantTimeEquals(configuredKey, submittedKey)) {
            throw new DomainException(ErrorCode.UNAUTHORIZED_ADMIN);
        }
        return true;
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }
}
