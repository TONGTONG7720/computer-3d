package com.pclab.hardware.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.pclab.hardware.intelligence.domain.PerformanceProfile;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record HardwareView(
        Long databaseId,
        String id,
        String name,
        String brand,
        String category,
        String builderCategory,
        String description,
        BigDecimal price,
        int performance,
        int popularity,
        PerformanceProfile performanceProfile,
        int power,
        String modelUrl,
        String modelVariant,
        String coverUrl,
        HardwareModelView primaryModel,
        String socket,
        Integer cores,
        Integer threads,
        Integer tdp,
        String cpuGeneration,
        Integer vram,
        Integer length,
        List<String> resolutionSupport,
        String ramType,
        String formFactor,
        String chipset,
        BigDecimal capacity,
        String generation,
        Integer frequency,
        String storageType,
        @JsonProperty("interface") String interfaceType,
        Integer readSpeed,
        Integer maxTdp,
        Integer radiatorSize,
        List<String> supportedSockets,
        Integer wattage,
        String certification,
        List<String> connectors,
        Integer gpuMaxLength,
        List<String> motherboardSize,
        Integer radiatorMaxSize
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
