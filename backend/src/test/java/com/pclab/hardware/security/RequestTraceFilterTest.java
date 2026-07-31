package com.pclab.hardware.security;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestTraceFilterTest {

    @Test
    void keepsValidTraceIdAndReturnsItToClient() throws Exception {
        RequestTraceFilter filter = new RequestTraceFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/hardware");
        request.addHeader(RequestTraceFilter.TRACE_HEADER, "front-trace-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (currentRequest, currentResponse) ->
                assertThat(org.slf4j.MDC.get(RequestTraceFilter.TRACE_MDC_KEY))
                        .isEqualTo("front-trace-123");

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader(RequestTraceFilter.TRACE_HEADER))
                .isEqualTo("front-trace-123");
        assertThat(org.slf4j.MDC.get(RequestTraceFilter.TRACE_MDC_KEY)).isNull();
    }
}
