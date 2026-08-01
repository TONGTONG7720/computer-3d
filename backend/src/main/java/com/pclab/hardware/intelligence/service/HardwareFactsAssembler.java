package com.pclab.hardware.intelligence.service;

import com.pclab.hardware.intelligence.domain.ComponentSpecification;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.domain.PerformanceProfile;
import com.pclab.hardware.vo.HardwareView;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class HardwareFactsAssembler {

    public HardwareFacts from(HardwareView view) {
        IntelligenceCategory category = IntelligenceCategory.fromBuilderCategory(
                view.builderCategory()
        );
        PerformanceProfile performance = view.performanceProfile() == null
                ? PerformanceProfile.baseline(view.performance())
                : view.performanceProfile();
        return new HardwareFacts(
                view.id(),
                view.name(),
                view.brand(),
                category,
                view.price(),
                view.power(),
                performance,
                specification(view, category),
                view.modelUrl(),
                view.modelVariant()
        );
    }

    private static ComponentSpecification specification(
            HardwareView view,
            IntelligenceCategory category
    ) {
        return switch (category) {
            case CPU -> new ComponentSpecification.Cpu(
                    required(view.socket(), "CPU socket"),
                    required(view.cores(), "CPU cores"),
                    required(view.threads(), "CPU threads"),
                    required(view.tdp(), "CPU TDP")
            );
            case GPU -> new ComponentSpecification.Gpu(
                    required(view.vram(), "GPU VRAM"),
                    required(view.length(), "GPU length"),
                    required(view.interfaceType(), "GPU interface"),
                    list(view.resolutionSupport())
            );
            case MOTHERBOARD -> new ComponentSpecification.Motherboard(
                    required(view.socket(), "motherboard socket"),
                    required(view.ramType(), "motherboard RAM type"),
                    required(view.formFactor(), "motherboard form factor"),
                    required(view.chipset(), "motherboard chipset")
            );
            case RAM -> new ComponentSpecification.Memory(
                    required(view.generation(), "memory generation"),
                    required(view.capacity(), "memory capacity").intValueExact(),
                    required(view.frequency(), "memory frequency")
            );
            case STORAGE -> new ComponentSpecification.Storage(
                    required(view.capacity(), "storage capacity").multiply(
                            java.math.BigDecimal.valueOf(1024)
                    ).intValueExact(),
                    required(view.interfaceType(), "storage interface"),
                    required(view.readSpeed(), "storage read speed")
            );
            case COOLING -> new ComponentSpecification.Cooling(
                    required(view.maxTdp(), "cooling capacity"),
                    required(view.radiatorSize(), "radiator size"),
                    list(view.supportedSockets())
            );
            case POWER_SUPPLY -> new ComponentSpecification.PowerSupply(
                    required(view.wattage(), "PSU wattage"),
                    list(view.connectors())
            );
            case CASE -> new ComponentSpecification.PcCase(
                    required(view.gpuMaxLength(), "case GPU clearance"),
                    list(view.motherboardSize()),
                    required(view.radiatorMaxSize(), "case radiator clearance")
            );
        };
    }

    private static <T> T required(T value, String field) {
        if (value == null) {
            throw new IllegalStateException("Missing hardware fact: " + field);
        }
        return value;
    }

    private static <T> List<T> list(List<T> value) {
        return List.copyOf(required(value, "list specification"));
    }
}
