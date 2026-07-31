package com.pclab.hardware.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.entity.CaseSpecEntity;
import com.pclab.hardware.entity.CoolingSpecEntity;
import com.pclab.hardware.entity.CpuSpecEntity;
import com.pclab.hardware.entity.GpuSpecEntity;
import com.pclab.hardware.entity.HardwareCategoryEntity;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.entity.MemorySpecEntity;
import com.pclab.hardware.entity.MotherboardSpecEntity;
import com.pclab.hardware.entity.PsuSpecEntity;
import com.pclab.hardware.entity.StorageSpecEntity;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class HardwareViewAssembler {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public HardwareViewAssembler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public HardwareView toView(
            HardwareEntity hardware,
            HardwareCategoryEntity category,
            Object specification
    ) {
        HardwareView.HardwareViewBuilder builder = HardwareView.builder()
                .databaseId(hardware.getId())
                .id(hardware.getHardwareKey())
                .name(hardware.getName())
                .brand(hardware.getBrand())
                .category(category.getCode())
                .builderCategory(category.getBuilderCategory())
                .description(hardware.getDescription())
                .price(hardware.getBasePrice())
                .performance(hardware.getPerformanceScore())
                .power(hardware.getPowerWatt())
                .modelUrl(hardware.getModelUrl())
                .modelVariant(hardware.getModelVariant())
                .coverUrl(hardware.getCoverUrl());

        switch (category.getCode()) {
            case "CPU" -> applyCpu(builder, requireSpec(specification, CpuSpecEntity.class));
            case "GPU" -> applyGpu(builder, requireSpec(specification, GpuSpecEntity.class));
            case "MOTHERBOARD" ->
                    applyMotherboard(builder, requireSpec(specification, MotherboardSpecEntity.class));
            case "RAM" -> applyMemory(builder, requireSpec(specification, MemorySpecEntity.class));
            case "SSD", "HDD" ->
                    applyStorage(builder, requireSpec(specification, StorageSpecEntity.class));
            case "COOLING" ->
                    applyCooling(builder, requireSpec(specification, CoolingSpecEntity.class));
            case "PSU" -> applyPsu(builder, requireSpec(specification, PsuSpecEntity.class));
            case "CASE" -> applyCase(builder, requireSpec(specification, CaseSpecEntity.class));
            default -> {
                // Dynamically added categories expose their base fields until a specification adapter exists.
            }
        }
        return builder.build();
    }

    private static void applyCpu(HardwareView.HardwareViewBuilder builder, CpuSpecEntity spec) {
        builder.socket(spec.getSocket())
                .cores(spec.getCores())
                .threads(spec.getThreads())
                .tdp(spec.getTdpWatt());
    }

    private static void applyGpu(HardwareView.HardwareViewBuilder builder, GpuSpecEntity spec) {
        builder.vram(spec.getVramGb())
                .length(spec.getLengthMm())
                .tdp(spec.getTdpWatt());
    }

    private static void applyMotherboard(
            HardwareView.HardwareViewBuilder builder,
            MotherboardSpecEntity spec
    ) {
        builder.socket(spec.getSocket())
                .ramType(spec.getRamType())
                .formFactor(spec.getFormFactor());
    }

    private static void applyMemory(
            HardwareView.HardwareViewBuilder builder,
            MemorySpecEntity spec
    ) {
        builder.capacity(BigDecimal.valueOf(spec.getCapacityGb()))
                .generation(spec.getGeneration())
                .frequency(spec.getFrequencyMhz());
    }

    private static void applyStorage(
            HardwareView.HardwareViewBuilder builder,
            StorageSpecEntity spec
    ) {
        BigDecimal terabytes = BigDecimal.valueOf(spec.getCapacityGb())
                .divide(BigDecimal.valueOf(1024), 2, RoundingMode.HALF_UP)
                .stripTrailingZeros();
        builder.capacity(terabytes)
                .storageType(spec.getStorageType())
                .interfaceType(spec.getInterfaceType())
                .readSpeed(spec.getReadSpeedMbps());
    }

    private void applyCooling(HardwareView.HardwareViewBuilder builder, CoolingSpecEntity spec) {
        builder.maxTdp(spec.getMaxTdpWatt())
                .radiatorSize(spec.getRadiatorSizeMm())
                .supportedSockets(parseStringList(spec.getSupportedSockets()));
    }

    private static void applyPsu(HardwareView.HardwareViewBuilder builder, PsuSpecEntity spec) {
        builder.wattage(spec.getWattage())
                .certification(spec.getCertification());
    }

    private void applyCase(HardwareView.HardwareViewBuilder builder, CaseSpecEntity spec) {
        builder.gpuMaxLength(spec.getGpuMaxLengthMm())
                .motherboardSize(parseStringList(spec.getMotherboardSizes()))
                .radiatorMaxSize(spec.getRadiatorMaxSizeMm());
    }

    private List<String> parseStringList(String json) {
        try {
            return List.copyOf(objectMapper.readValue(json, STRING_LIST));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored hardware specification JSON is invalid", exception);
        }
    }

    private static <T> T requireSpec(Object specification, Class<T> expectedType) {
        if (!expectedType.isInstance(specification)) {
            throw new IllegalStateException("Missing specification for " + expectedType.getSimpleName());
        }
        return expectedType.cast(specification);
    }
}
