package com.pclab.hardware.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.entity.CpuSpecEntity;
import com.pclab.hardware.entity.HardwareCategoryEntity;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.vo.HardwareView;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class HardwareViewAssemblerTest {

    @Test
    void flattensCpuSpecificationForBuilder() throws ReflectiveOperationException {
        HardwareEntity hardware = new HardwareEntity();
        hardware.setId(7L);
        hardware.setHardwareKey("cpu-intel-i9-14900k");
        hardware.setName("Intel Core i9-14900K");
        hardware.setBrand("Intel");
        hardware.setCategoryCode("CPU");
        hardware.setBasePrice(new BigDecimal("3999.00"));
        hardware.setPerformanceScore(96);
        hardware.setPowerWatt(253);
        hardware.setModelUrl("/models/cpu_i9_14900k.glb");
        hardware.setModelVariant("intel-i9");

        HardwareCategoryEntity category = new HardwareCategoryEntity();
        category.setCode("CPU");
        category.setBuilderCategory("cpu");

        CpuSpecEntity specification = new CpuSpecEntity();
        specification.setHardwareId(7L);
        specification.setSocket("LGA1700");
        specification.setCores(24);
        specification.setThreads(32);
        specification.setTdpWatt(253);

        Class<?> assemblerType;
        try {
            assemblerType = Class.forName("com.pclab.hardware.service.HardwareViewAssembler");
        } catch (ClassNotFoundException exception) {
            fail("HardwareViewAssembler is not implemented", exception);
            return;
        }
        Constructor<?> constructor = assemblerType.getConstructor(ObjectMapper.class);
        Method toView = assemblerType.getMethod(
                "toView",
                HardwareEntity.class,
                HardwareCategoryEntity.class,
                Object.class
        );

        HardwareView view = (HardwareView) toView.invoke(
                constructor.newInstance(new ObjectMapper()),
                hardware,
                category,
                specification
        );

        assertThat(view.id()).isEqualTo("cpu-intel-i9-14900k");
        assertThat(view.builderCategory()).isEqualTo("cpu");
        assertThat(view.socket()).isEqualTo("LGA1700");
        assertThat(view.cores()).isEqualTo(24);
        assertThat(view.tdp()).isEqualTo(253);
    }
}
