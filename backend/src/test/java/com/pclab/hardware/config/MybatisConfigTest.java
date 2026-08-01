package com.pclab.hardware.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.annotation.MapperScan;

class MybatisConfigTest {

    @Test
    void registersOptimisticLockerForVersionedHardwareUpdates() {
        var interceptor = new MybatisConfig().mybatisPlusInterceptor();

        assertThat(interceptor.getInterceptors())
                .anyMatch(OptimisticLockerInnerInterceptor.class::isInstance);
    }

    @Test
    void scansEveryDomainMapperPackage() {
        MapperScan mapperScan = MybatisConfig.class.getAnnotation(MapperScan.class);

        assertThat(mapperScan.value()).contains(
                "com.pclab.hardware.mapper",
                "com.pclab.hardware.price.mapper",
                "com.pclab.hardware.ai.mapper",
                "com.pclab.hardware.intelligence.mapper"
        );
    }
}
