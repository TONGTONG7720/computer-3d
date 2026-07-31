package com.pclab.hardware.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import org.junit.jupiter.api.Test;

class MybatisConfigTest {

    @Test
    void registersOptimisticLockerForVersionedHardwareUpdates() {
        var interceptor = new MybatisConfig().mybatisPlusInterceptor();

        assertThat(interceptor.getInterceptors())
                .anyMatch(OptimisticLockerInnerInterceptor.class::isInstance);
    }
}
