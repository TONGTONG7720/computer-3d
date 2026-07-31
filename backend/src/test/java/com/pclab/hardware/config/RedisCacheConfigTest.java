package com.pclab.hardware.config;

import static org.assertj.core.api.Assertions.assertThatCode;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.vo.BuildConfigView;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class RedisCacheConfigTest {

    @Test
    void serializesBuildsContainingJavaTimeValues() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        BuildConfigView build = new BuildConfigView(
                "build-id",
                "测试配置",
                Map.of("cpu", "cpu-id"),
                List.of(),
                BigDecimal.valueOf(8999),
                88,
                650,
                "SUCCESS",
                LocalDateTime.of(2026, 7, 31, 10, 30)
        );

        assertThatCode(() -> RedisCacheConfig.redisValueSerializer(objectMapper).serialize(build))
                .doesNotThrowAnyException();
    }
}
