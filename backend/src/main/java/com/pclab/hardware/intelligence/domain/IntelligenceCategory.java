package com.pclab.hardware.intelligence.domain;

public enum IntelligenceCategory {
    CPU("cpu"),
    GPU("gpu"),
    MOTHERBOARD("motherboard"),
    RAM("ram"),
    STORAGE("storage"),
    COOLING("cooling"),
    POWER_SUPPLY("power_supply"),
    CASE("case");

    private final String builderCategory;

    IntelligenceCategory(String builderCategory) {
        this.builderCategory = builderCategory;
    }

    public String builderCategory() {
        return builderCategory;
    }

    public static IntelligenceCategory fromBuilderCategory(String value) {
        return switch (value) {
            case "cpu" -> CPU;
            case "gpu" -> GPU;
            case "motherboard" -> MOTHERBOARD;
            case "ram" -> RAM;
            case "storage" -> STORAGE;
            case "cooling" -> COOLING;
            case "power_supply" -> POWER_SUPPLY;
            case "case" -> CASE;
            default -> throw new IllegalArgumentException("Unsupported builder category: " + value);
        };
    }
}
