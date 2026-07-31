package com.pclab.hardware.security;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Clock;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@ConditionalOnBean(StringRedisTemplate.class)
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger LOGGER = LoggerFactory.getLogger(RateLimitInterceptor.class);
    private static final Duration WINDOW_TTL = Duration.ofSeconds(90);

    private final StringRedisTemplate redisTemplate;
    private final SecurityProperties properties;
    private final Clock clock;

    @Autowired
    public RateLimitInterceptor(
            StringRedisTemplate redisTemplate,
            SecurityProperties properties
    ) {
        this(redisTemplate, properties, Clock.systemUTC());
    }

    RateLimitInterceptor(
            StringRedisTemplate redisTemplate,
            SecurityProperties properties,
            Clock clock
    ) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        boolean adminRequest = request.getRequestURI().startsWith("/api/admin/");
        int limit = adminRequest
                ? properties.getAdminRateLimitPerMinute()
                : properties.getPublicRateLimitPerMinute();
        String scope = adminRequest ? "admin" : "public";
        long minute = clock.instant().getEpochSecond() / 60;
        String key = "pclab:v1:rate:" + scope + ":" + clientAddress(request) + ":" + minute;

        try {
            Long current = redisTemplate.opsForValue().increment(key);
            if (Long.valueOf(1L).equals(current)) {
                redisTemplate.expire(key, WINDOW_TTL);
            }
            if (current != null && current > limit) {
                throw new DomainException(ErrorCode.RATE_LIMITED);
            }
        } catch (DomainException exception) {
            throw exception;
        } catch (DataAccessException exception) {
            LOGGER.warn("Redis rate limiter unavailable; allowing request to continue");
        }
        return true;
    }

    private static String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String firstAddress = forwarded.split(",", 2)[0].trim();
            if (!firstAddress.isBlank() && firstAddress.length() <= 64) {
                return firstAddress.replace(':', '_');
            }
        }
        return request.getRemoteAddr().replace(':', '_');
    }
}
