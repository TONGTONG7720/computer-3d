package com.pclab.hardware.intelligence.domain;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public final class BuildSelection {

    private final Map<IntelligenceCategory, HardwareFacts> components;

    private BuildSelection(Map<IntelligenceCategory, HardwareFacts> components) {
        this.components = Collections.unmodifiableMap(components);
    }

    public static BuildSelection of(Map<IntelligenceCategory, HardwareFacts> components) {
        Objects.requireNonNull(components, "components");
        EnumMap<IntelligenceCategory, HardwareFacts> copy =
                new EnumMap<>(IntelligenceCategory.class);
        components.forEach((category, facts) -> {
            Objects.requireNonNull(category, "component category");
            Objects.requireNonNull(facts, "component facts");
            if (category != facts.category()) {
                throw new IllegalArgumentException(
                        "Selection category " + category + " does not match " + facts.category()
                );
            }
            copy.put(category, facts);
        });
        return new BuildSelection(copy);
    }

    public Map<IntelligenceCategory, HardwareFacts> components() {
        return components;
    }

    public Optional<HardwareFacts> get(IntelligenceCategory category) {
        return Optional.ofNullable(components.get(category));
    }

    public BuildSelection with(IntelligenceCategory category, HardwareFacts facts) {
        EnumMap<IntelligenceCategory, HardwareFacts> copy =
                new EnumMap<>(IntelligenceCategory.class);
        copy.putAll(components);
        copy.put(category, facts);
        return of(copy);
    }

    public BuildSelection without(IntelligenceCategory category) {
        EnumMap<IntelligenceCategory, HardwareFacts> copy =
                new EnumMap<>(IntelligenceCategory.class);
        copy.putAll(components);
        copy.remove(category);
        return new BuildSelection(copy);
    }

    public List<IntelligenceCategory> missingCategories() {
        return List.of(IntelligenceCategory.values()).stream()
                .filter(category -> !components.containsKey(category))
                .toList();
    }

    public BigDecimal totalPrice() {
        return components.values().stream()
                .map(HardwareFacts::price)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public int systemPowerWatt() {
        return components.entrySet().stream()
                .filter(entry -> entry.getKey() != IntelligenceCategory.POWER_SUPPLY)
                .mapToInt(entry -> entry.getValue().powerWatt())
                .sum();
    }
}
