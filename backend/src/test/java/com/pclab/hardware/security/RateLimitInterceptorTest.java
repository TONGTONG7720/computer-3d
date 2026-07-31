package com.pclab.hardware.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitInterceptorTest {

    @Test
    void blocksRequestsAboveConfiguredLimit() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> values = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        when(values.increment(anyString())).thenReturn(3L);
        SecurityProperties properties = propertiesWithLimits(2, 1);
        RateLimitInterceptor interceptor = new RateLimitInterceptor(
                redis,
                properties,
                fixedClock()
        );
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/hardware");
        request.setRemoteAddr("127.0.0.1");

        assertThatThrownBy(() -> interceptor.preHandle(
                request,
                new MockHttpServletResponse(),
                new Object()
        ))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        assertThat(exception.errorCode()).isEqualTo(ErrorCode.RATE_LIMITED)
                );
    }

    @Test
    void allowsDatabaseFallbackWhenRedisIsUnavailable() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.opsForValue()).thenThrow(new RedisConnectionFailureException("offline"));
        RateLimitInterceptor interceptor = new RateLimitInterceptor(
                redis,
                propertiesWithLimits(2, 1),
                fixedClock()
        );

        boolean accepted = interceptor.preHandle(
                new MockHttpServletRequest("GET", "/api/hardware"),
                new MockHttpServletResponse(),
                new Object()
        );

        assertThat(accepted).isTrue();
    }

    private static SecurityProperties propertiesWithLimits(int publicLimit, int adminLimit) {
        SecurityProperties properties = new SecurityProperties();
        properties.setPublicRateLimitPerMinute(publicLimit);
        properties.setAdminRateLimitPerMinute(adminLimit);
        return properties;
    }

    private static Clock fixedClock() {
        return Clock.fixed(Instant.parse("2026-07-31T10:00:00Z"), ZoneOffset.UTC);
    }
}
