package com.pclab.hardware.vo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;

class ApiResponseTest {

    @Test
    void createsStableSuccessEnvelope() throws ReflectiveOperationException {
        Class<?> responseType;
        try {
            responseType = Class.forName("com.pclab.hardware.vo.ApiResponse");
        } catch (ClassNotFoundException exception) {
            fail("ApiResponse success envelope is not implemented", exception);
            return;
        }
        Method successFactory = responseType.getMethod("success", Object.class);

        Object response = successFactory.invoke(null, "hardware-ready");

        assertThat(responseType.getMethod("code").invoke(response)).isEqualTo("OK");
        assertThat(responseType.getMethod("message").invoke(response)).isEqualTo("success");
        assertThat(responseType.getMethod("data").invoke(response)).isEqualTo("hardware-ready");
        assertThat(responseType.getMethod("timestamp").invoke(response)).isNotNull();
    }
}
