package com.pclab.hardware.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AdminKeyInterceptorTest {

    @Test
    void acceptsConfiguredAdminKey() {
        SecurityProperties properties = new SecurityProperties();
        properties.setAdminKey("test-admin-key");
        AdminKeyInterceptor interceptor = new AdminKeyInterceptor(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(AdminKeyInterceptor.ADMIN_KEY_HEADER, "test-admin-key");

        boolean accepted = interceptor.preHandle(
                request,
                new MockHttpServletResponse(),
                new Object()
        );

        assertThat(accepted).isTrue();
    }

    @Test
    void rejectsMissingOrIncorrectAdminKey() {
        SecurityProperties properties = new SecurityProperties();
        properties.setAdminKey("test-admin-key");
        AdminKeyInterceptor interceptor = new AdminKeyInterceptor(properties);

        assertThatThrownBy(() -> interceptor.preHandle(
                new MockHttpServletRequest(),
                new MockHttpServletResponse(),
                new Object()
        ))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        assertThat(exception.errorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_ADMIN)
                );
    }
}
