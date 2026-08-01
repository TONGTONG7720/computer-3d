package com.pclab.hardware.intelligence.vo;

import com.pclab.hardware.intelligence.domain.BudgetReport;
import com.pclab.hardware.intelligence.domain.CompatibilityReport;
import com.pclab.hardware.intelligence.domain.PerformanceReport;
import java.math.BigDecimal;
import java.util.Map;

public record BuildAnalysisView(
        long revision,
        Map<String, String> components,
        BigDecimal totalPrice,
        int systemPowerWatt,
        String priceSource,
        CompatibilityReport compatibility,
        PerformanceReport performance,
        BudgetReport budget
) {

    public BuildAnalysisView {
        components = Map.copyOf(components);
    }
}
