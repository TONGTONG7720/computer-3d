package com.pclab.hardware.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.EnumMap;
import java.util.Map;

public record BuildComponentIds(
        @NotBlank @Size(max = 80) String cpu,
        @NotBlank @Size(max = 80) String gpu,
        @NotBlank @Size(max = 80) String motherboard,
        @NotBlank @Size(max = 80) String ram,
        @NotBlank @Size(max = 80) String storage,
        @NotBlank @Size(max = 80) String cooling,
        @JsonProperty("power_supply") @NotBlank @Size(max = 80) String powerSupply,
        @JsonProperty("case") @NotBlank @Size(max = 80) String pcCase
) {

    public Map<IntelligenceCategory, String> asIntelligenceMap() {
        EnumMap<IntelligenceCategory, String> ids = new EnumMap<>(IntelligenceCategory.class);
        ids.put(IntelligenceCategory.CPU, cpu);
        ids.put(IntelligenceCategory.GPU, gpu);
        ids.put(IntelligenceCategory.MOTHERBOARD, motherboard);
        ids.put(IntelligenceCategory.RAM, ram);
        ids.put(IntelligenceCategory.STORAGE, storage);
        ids.put(IntelligenceCategory.COOLING, cooling);
        ids.put(IntelligenceCategory.POWER_SUPPLY, powerSupply);
        ids.put(IntelligenceCategory.CASE, pcCase);
        return Map.copyOf(ids);
    }
}
