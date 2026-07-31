package com.pclab.hardware.price.adapter;

import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PlatformAdapterRegistry {

    private final List<PlatformAdapter> adapters;

    public PlatformAdapterRegistry(List<PlatformAdapter> adapters) {
        this.adapters = List.copyOf(adapters);
    }

    public List<PlatformAdapter> enabledAdapters() {
        return adapters.stream()
                .filter(PlatformAdapter::isEnabled)
                .sorted(Comparator.comparing(PlatformAdapter::adapterCode))
                .toList();
    }
}
