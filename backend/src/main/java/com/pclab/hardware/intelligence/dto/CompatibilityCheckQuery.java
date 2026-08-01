package com.pclab.hardware.intelligence.dto;

import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import jakarta.validation.constraints.Size;
import java.util.EnumMap;
import java.util.Map;
import lombok.Data;

@Data
public class CompatibilityCheckQuery {

    @Size(max = 80)
    private String cpu;

    @Size(max = 80)
    private String gpu;

    @Size(max = 80)
    private String motherboard;

    @Size(max = 80)
    private String ram;

    @Size(max = 80)
    private String storage;

    @Size(max = 80)
    private String cooling;

    @Size(max = 80)
    private String powerSupply;

    @Size(max = 80)
    private String pcCase;

    public void setPower_supply(String value) {
        this.powerSupply = value;
    }

    public void setCase(String value) {
        this.pcCase = value;
    }

    public Map<IntelligenceCategory, String> asIntelligenceMap() {
        EnumMap<IntelligenceCategory, String> ids = new EnumMap<>(IntelligenceCategory.class);
        put(ids, IntelligenceCategory.CPU, cpu);
        put(ids, IntelligenceCategory.GPU, gpu);
        put(ids, IntelligenceCategory.MOTHERBOARD, motherboard);
        put(ids, IntelligenceCategory.RAM, ram);
        put(ids, IntelligenceCategory.STORAGE, storage);
        put(ids, IntelligenceCategory.COOLING, cooling);
        put(ids, IntelligenceCategory.POWER_SUPPLY, powerSupply);
        put(ids, IntelligenceCategory.CASE, pcCase);
        return Map.copyOf(ids);
    }

    private static void put(
            EnumMap<IntelligenceCategory, String> ids,
            IntelligenceCategory category,
            String value
    ) {
        if (value != null && !value.isBlank()) {
            ids.put(category, value.trim());
        }
    }
}
