package com.pclab.hardware;

import static org.assertj.core.api.Assertions.assertThatCode;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest
class HardwarePlatformApplicationTests {

    @Test
    void exposesApplicationEntryPoint() {
        assertThatCode(() -> Class.forName("com.pclab.hardware.HardwarePlatformApplication"))
                .doesNotThrowAnyException();
    }
}
