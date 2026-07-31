package com.pclab.hardware.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.pclab.hardware.vo.HardwareView;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class BuildMetricsCalculatorTest {

    @Test
    void calculatesServerOwnedBuildMetrics() throws ReflectiveOperationException {
        Map<String, HardwareView> components = compatibleComponents();
        Class<?> calculatorType = calculatorType();

        Method calculate = calculatorType.getMethod("calculate", Map.class);
        Object metrics = calculate.invoke(null, components);
        Class<?> metricsType = metrics.getClass();

        assertThat(metricsType.getMethod("totalPrice").invoke(metrics))
                .isEqualTo(new BigDecimal("800.00"));
        assertThat(metricsType.getMethod("powerUsageWatt").invoke(metrics)).isEqualTo(520);
        assertThat(metricsType.getMethod("performanceScore").invoke(metrics)).isEqualTo(80);
        assertThat(metricsType.getMethod("compatibilityStatus").invoke(metrics)).isEqualTo("SUCCESS");
    }

    @Test
    void reportsSocketMismatchAsError() throws ReflectiveOperationException {
        Map<String, HardwareView> components = new java.util.HashMap<>(compatibleComponents());
        components.put(
                "motherboard",
                HardwareView.builder()
                        .id("mb")
                        .price(new BigDecimal("100.00"))
                        .performance(80)
                        .power(40)
                        .socket("AM5")
                        .ramType("DDR5")
                        .formFactor("ATX")
                        .build()
        );
        Class<?> calculatorType = calculatorType();
        Object metrics = calculatorType.getMethod("calculate", Map.class)
                .invoke(null, components);

        assertThat(metrics.getClass().getMethod("compatibilityStatus").invoke(metrics))
                .isEqualTo("ERROR");
    }

    private static Map<String, HardwareView> compatibleComponents() {
        return Map.of(
                "cpu",
                base("cpu", 80, 120).socket("LGA1700").tdp(120).build(),
                "gpu",
                base("gpu", 80, 300).length(300).build(),
                "motherboard",
                base("motherboard", 80, 40)
                        .socket("LGA1700")
                        .ramType("DDR5")
                        .formFactor("ATX")
                        .build(),
                "ram",
                base("ram", 80, 10).generation("DDR5").build(),
                "storage",
                base("storage", 80, 5).build(),
                "cooling",
                base("cooling", 80, 15)
                        .maxTdp(200)
                        .radiatorSize(240)
                        .supportedSockets(List.of("LGA1700", "AM5"))
                        .build(),
                "power_supply",
                base("power_supply", 80, 0).wattage(850).build(),
                "case",
                base("case", 80, 30)
                        .gpuMaxLength(360)
                        .motherboardSize(List.of("ATX", "Micro-ATX"))
                        .radiatorMaxSize(360)
                        .build()
        );
    }

    private static HardwareView.HardwareViewBuilder base(
            String id,
            int performance,
            int power
    ) {
        return HardwareView.builder()
                .id(id)
                .price(new BigDecimal("100.00"))
                .performance(performance)
                .power(power);
    }

    private static Class<?> calculatorType() {
        try {
            return Class.forName("com.pclab.hardware.service.BuildMetricsCalculator");
        } catch (ClassNotFoundException exception) {
            fail("BuildMetricsCalculator is not implemented", exception);
            return Object.class;
        }
    }
}
