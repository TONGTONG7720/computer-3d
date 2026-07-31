package com.pclab.hardware.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
        int power,
        String modelUrl,
        String modelVariant,
        String coverUrl,
        String socket,
        Integer cores,
        Integer threads,
        Integer tdp,
        Integer vram,
        Integer length,
        String ramType,
        String formFactor,
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
        Integer gpuMaxLength,
        List<String> motherboardSize,
        Integer radiatorMaxSize
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
