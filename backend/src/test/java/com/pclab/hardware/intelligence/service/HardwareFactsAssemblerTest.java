package com.pclab.hardware.intelligence.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.intelligence.domain.ComponentSpecification;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.PerformanceProfile;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class HardwareFactsAssemblerTest {

    private final HardwareFactsAssembler assembler = new HardwareFactsAssembler();

    @Test
    void createsTypedCpuFactsWhenTheCatalogueReturnsACpu() {
        HardwareView view = HardwareView.builder()
                .id("cpu-intel-i9-14900k")
                .name("Intel Core i9-14900K")
                .brand("Intel")
                .category("CPU")
                .builderCategory("cpu")
                .price(new BigDecimal("3999.00"))
                .power(253)
                .performance(96)
                .performanceProfile(new PerformanceProfile(94, 100, 96, "reviewed", 1))
                .socket("LGA1700")
                .cores(24)
                .threads(32)
                .tdp(253)
                .cpuGeneration("Raptor Lake Refresh")
                .build();

        HardwareFacts facts = assembler.from(view);

        assertThat(facts.id()).isEqualTo("cpu-intel-i9-14900k");
        assertThat(facts.performance().creator()).isEqualTo(100);
        assertThat(facts.specification())
                .isEqualTo(new ComponentSpecification.Cpu("LGA1700", 24, 32, 253));
    }

    @Test
    void createsTypedCaseFactsWithImmutableSupportedFormFactors() {
        HardwareView view = HardwareView.builder()
                .id("case-future-glass")
                .name("Future Glass Case")
                .brand("PC LAB")
                .category("CASE")
                .builderCategory("case")
                .price(new BigDecimal("1299.00"))
                .power(8)
                .performance(94)
                .performanceProfile(new PerformanceProfile(94, 94, 94, "reviewed", 1))
                .gpuMaxLength(360)
                .motherboardSize(List.of("ATX", "Micro-ATX"))
                .radiatorMaxSize(360)
                .build();

        HardwareFacts facts = assembler.from(view);

        assertThat(facts.specification()).isEqualTo(
                new ComponentSpecification.PcCase(360, List.of("ATX", "Micro-ATX"), 360)
        );
    }
}
