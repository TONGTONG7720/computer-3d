package com.pclab.hardware.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.List;

public final class SpecificationPayloads {

    private SpecificationPayloads() {
    }

    public record Cpu(
            @NotBlank String socket,
            @NotNull @Min(1) Integer cores,
            @NotNull @Min(1) Integer threads,
            @NotNull @DecimalMin("0.1") BigDecimal baseClockGhz,
            @NotNull @DecimalMin("0.1") BigDecimal boostClockGhz,
            @NotNull @Min(1) Integer tdp
    ) {
    }

    public record Gpu(
            @NotBlank String chipset,
            @NotNull @Min(1) Integer vram,
            @NotBlank String vramType,
            @NotNull @Min(1) Integer length,
            @NotNull @Min(1) Integer tdp
    ) {
    }

    public record Motherboard(
            @NotBlank String socket,
            @NotBlank @Pattern(regexp = "DDR4|DDR5") String ramType,
            @NotBlank String formFactor,
            @NotNull @Min(1) @Max(16) Integer memorySlots,
            @NotNull @Min(1) Integer maxMemoryGb,
            @NotBlank String pcieVersion
    ) {
    }

    public record Memory(
            @NotNull @Min(1) Integer capacity,
            @NotBlank @Pattern(regexp = "DDR4|DDR5") String generation,
            @NotNull @Min(1) Integer frequency,
            @NotNull @Min(1) @Max(16) Integer moduleCount,
            @NotBlank String latency
    ) {
    }

    public record Storage(
            @NotBlank @Pattern(regexp = "SSD|HDD|NVME") String storageType,
            @NotNull @Min(1) Integer capacityGb,
            @NotBlank String interfaceType,
            @NotNull @Min(0) Integer readSpeed,
            @NotNull @Min(0) Integer writeSpeed
    ) {
    }

    public record Cooling(
            @NotBlank @Pattern(regexp = "AIR|AIO") String coolingType,
            @NotNull @Min(1) Integer maxTdp,
            @NotNull @Min(0) @Max(480) Integer radiatorSize,
            @NotEmpty List<@NotBlank String> supportedSockets
    ) {
    }

    public record Psu(
            @NotNull @Min(100) Integer wattage,
            @NotBlank String certification,
            @NotBlank @Pattern(regexp = "FULL|SEMI|NON") String modularType
    ) {
    }

    public record PcCase(
            @NotNull @Min(1) Integer gpuMaxLength,
            @NotEmpty List<@NotBlank String> motherboardSize,
            @NotNull @Min(0) @Max(480) Integer radiatorMaxSize,
            @NotNull @Min(1) Integer coolerMaxHeight
    ) {
    }
}
