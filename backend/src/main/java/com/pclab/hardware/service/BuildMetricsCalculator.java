package com.pclab.hardware.service;

import com.pclab.hardware.vo.HardwareView;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Objects;

public final class BuildMetricsCalculator {

    private BuildMetricsCalculator() {
    }

    public static BuildMetrics calculate(Map<String, HardwareView> components) {
        HardwareView cpu = requireComponent(components, "cpu");
        HardwareView gpu = requireComponent(components, "gpu");
        HardwareView motherboard = requireComponent(components, "motherboard");
        HardwareView ram = requireComponent(components, "ram");
        HardwareView storage = requireComponent(components, "storage");
        HardwareView cooling = requireComponent(components, "cooling");
        HardwareView powerSupply = requireComponent(components, "power_supply");
        HardwareView pcCase = requireComponent(components, "case");

        BigDecimal totalPrice = components.values().stream()
                .map(HardwareView::price)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        int powerUsage = components.entrySet().stream()
                .filter(entry -> !entry.getKey().equals("power_supply"))
                .mapToInt(entry -> entry.getValue().power())
                .sum();
        int gaming = weightedScore(
                gpu.performance(), 0.55,
                cpu.performance(), 0.30,
                ram.performance(), 0.10,
                storage.performance(), 0.05
        );
        int production = weightedScore(
                cpu.performance(), 0.40,
                gpu.performance(), 0.30,
                ram.performance(), 0.15,
                storage.performance(), 0.15
        );
        int ai = weightedScore(
                gpu.performance(), 0.65,
                cpu.performance(), 0.15,
                ram.performance(), 0.15,
                storage.performance(), 0.05
        );
        int performance = Math.round((gaming + production + ai) / 3.0f);
        String compatibility = compatibilityStatus(
                cpu,
                gpu,
                motherboard,
                ram,
                cooling,
                powerSupply,
                pcCase,
                powerUsage
        );
        return new BuildMetrics(totalPrice, powerUsage, performance, compatibility);
    }

    private static String compatibilityStatus(
            HardwareView cpu,
            HardwareView gpu,
            HardwareView motherboard,
            HardwareView ram,
            HardwareView cooling,
            HardwareView powerSupply,
            HardwareView pcCase,
            int powerUsage
    ) {
        boolean incompatible = !Objects.equals(cpu.socket(), motherboard.socket())
                || !Objects.equals(ram.generation(), motherboard.ramType())
                || gpu.length() > pcCase.gpuMaxLength()
                || cooling.maxTdp() < cpu.tdp()
                || cooling.supportedSockets() == null
                || !cooling.supportedSockets().contains(cpu.socket())
                || pcCase.motherboardSize() == null
                || !pcCase.motherboardSize().contains(motherboard.formFactor())
                || (cooling.radiatorSize() > 0
                && cooling.radiatorSize() > pcCase.radiatorMaxSize())
                || powerSupply.wattage() < powerUsage;
        if (incompatible) {
            return "ERROR";
        }
        int recommendedWattage = (int) Math.ceil(powerUsage * 1.2 / 50.0) * 50;
        return powerSupply.wattage() < recommendedWattage ? "WARNING" : "SUCCESS";
    }

    private static int weightedScore(
            int firstScore,
            double firstWeight,
            int secondScore,
            double secondWeight,
            int thirdScore,
            double thirdWeight,
            int fourthScore,
            double fourthWeight
    ) {
        double score = firstScore * firstWeight
                + secondScore * secondWeight
                + thirdScore * thirdWeight
                + fourthScore * fourthWeight;
        return Math.max(0, Math.min(100, (int) Math.round(score)));
    }

    private static HardwareView requireComponent(
            Map<String, HardwareView> components,
            String category
    ) {
        HardwareView component = components.get(category);
        if (component == null) {
            throw new IllegalArgumentException("Missing build component: " + category);
        }
        return component;
    }

    public record BuildMetrics(
            BigDecimal totalPrice,
            int powerUsageWatt,
            int performanceScore,
            String compatibilityStatus
    ) implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;
    }
}
