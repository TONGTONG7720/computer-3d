package com.pclab.hardware.intelligence;

import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.ComponentSpecification;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.domain.PerformanceProfile;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class HardwareFactsFixtures {

    private HardwareFactsFixtures() {
    }

    public static BuildSelection compatibleBuild() {
        return BuildSelection.of(Map.ofEntries(
                Map.entry(IntelligenceCategory.CPU, cpu("AM5", 120)),
                Map.entry(IntelligenceCategory.GPU, gpu(304, 360)),
                Map.entry(IntelligenceCategory.MOTHERBOARD, motherboard("AM5", "DDR5", "ATX")),
                Map.entry(IntelligenceCategory.RAM, ram("DDR5", 32)),
                Map.entry(IntelligenceCategory.STORAGE, storage()),
                Map.entry(IntelligenceCategory.COOLING, cooling(220, 240, List.of("AM5"))),
                Map.entry(IntelligenceCategory.POWER_SUPPLY, psu(850)),
                Map.entry(IntelligenceCategory.CASE, pcCase(360, List.of("ATX"), 360))
        ));
    }

    public static HardwareFacts cpu(String socket, int power) {
        return facts(
                "cpu-test",
                IntelligenceCategory.CPU,
                power,
                new PerformanceProfile(90, 95, 80, "test", 1),
                new ComponentSpecification.Cpu(socket, 8, 16, power)
        );
    }

    public static HardwareFacts gpu(int length, int power) {
        return facts(
                "gpu-test",
                IntelligenceCategory.GPU,
                power,
                new PerformanceProfile(100, 90, 100, "test", 1),
                new ComponentSpecification.Gpu(16, length, "PCIe 5.0", List.of("4K"))
        );
    }

    public static HardwareFacts motherboard(String socket, String ramType, String formFactor) {
        return facts(
                "motherboard-test",
                IntelligenceCategory.MOTHERBOARD,
                45,
                PerformanceProfile.baseline(75),
                new ComponentSpecification.Motherboard(socket, ramType, formFactor, "TEST")
        );
    }

    public static HardwareFacts ram(String generation, int capacity) {
        return facts(
                "ram-test",
                IntelligenceCategory.RAM,
                10,
                new PerformanceProfile(80, 80, 80, "test", 1),
                new ComponentSpecification.Memory(generation, capacity, 6000)
        );
    }

    public static HardwareFacts storage() {
        return facts(
                "storage-test",
                IntelligenceCategory.STORAGE,
                7,
                new PerformanceProfile(70, 70, 70, "test", 1),
                new ComponentSpecification.Storage(1024, "PCIe 4.0", 7000)
        );
    }

    public static HardwareFacts cooling(
            int maxTdp,
            int radiator,
            List<String> sockets
    ) {
        return facts(
                "cooling-test",
                IntelligenceCategory.COOLING,
                14,
                PerformanceProfile.baseline(75),
                new ComponentSpecification.Cooling(maxTdp, radiator, sockets)
        );
    }

    public static HardwareFacts psu(int wattage) {
        return facts(
                "psu-test-" + wattage,
                IntelligenceCategory.POWER_SUPPLY,
                0,
                PerformanceProfile.baseline(75),
                new ComponentSpecification.PowerSupply(wattage, List.of("12V-2x6"))
        );
    }

    public static HardwareFacts pcCase(
            int gpuLength,
            List<String> formFactors,
            int radiator
    ) {
        return facts(
                "case-test",
                IntelligenceCategory.CASE,
                8,
                PerformanceProfile.baseline(75),
                new ComponentSpecification.PcCase(gpuLength, formFactors, radiator)
        );
    }

    private static HardwareFacts facts(
            String id,
            IntelligenceCategory category,
            int power,
            PerformanceProfile performance,
            ComponentSpecification specification
    ) {
        return new HardwareFacts(
                id,
                id,
                "PC LAB",
                category,
                new BigDecimal("1000.00"),
                power,
                performance,
                specification,
                "/models/test.glb",
                "test"
        );
    }
}
