package com.pclab.hardware.intelligence.engine;

import static com.pclab.hardware.intelligence.HardwareFactsFixtures.compatibleBuild;
import static com.pclab.hardware.intelligence.HardwareFactsFixtures.ram;
import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.intelligence.domain.BuildOptimizationPlan;
import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleDefinition;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.domain.OptimizationGoal;
import com.pclab.hardware.intelligence.domain.PerformanceProfile;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class BuildOptimizerTest {

    private final BuildOptimizer optimizer = new BuildOptimizer(
            new CompatibilityEngine(),
            new PerformanceEngine()
    );

    @Test
    void upgradesSixteenGigabytesWhenFlagshipPartsWouldBeBottlenecked() {
        HardwareFacts ram16 = variant(
                ram("DDR5", 16),
                "ram-ddr5-16",
                "DDR5 16GB",
                "500",
                new PerformanceProfile(50, 48, 45, "test", 1)
        );
        HardwareFacts ram32 = variant(
                ram("DDR5", 32),
                "ram-ddr5-32",
                "DDR5 32GB",
                "800",
                new PerformanceProfile(80, 80, 80, "test", 1)
        );
        BuildSelection input = compatibleBuild().with(IntelligenceCategory.RAM, ram16);

        BuildOptimizationPlan plan = optimizer.optimize(
                input,
                catalogue(input, ram32),
                new BigDecimal("10000"),
                OptimizationGoal.GAMING,
                CompatibilityRuleDefinition.standardRules()
        );

        assertThat(plan.selection().get(IntelligenceCategory.RAM).orElseThrow().id())
                .isEqualTo("ram-ddr5-32");
        assertThat(plan.suggestions()).extracting(suggestion -> suggestion.code())
                .contains("RAM_CAPACITY_BOTTLENECK");
        assertThat(input.get(IntelligenceCategory.RAM).orElseThrow().id())
                .isEqualTo("ram-ddr5-16");
    }

    @Test
    void reducesAnOverBudgetGamingBuildWithoutReplacingTheGpuWhenFeasible() {
        BuildSelection input = compatibleBuild();
        HardwareFacts cheapCpu = cheaper(input, IntelligenceCategory.CPU, "cpu-value", "400");
        HardwareFacts cheapStorage = cheaper(
                input,
                IntelligenceCategory.STORAGE,
                "storage-value",
                "400"
        );
        HardwareFacts cheapCase = cheaper(input, IntelligenceCategory.CASE, "case-value", "400");

        BuildOptimizationPlan plan = optimizer.optimize(
                input,
                catalogue(input, cheapCpu, cheapStorage, cheapCase),
                new BigDecimal("6500"),
                OptimizationGoal.GAMING,
                CompatibilityRuleDefinition.standardRules()
        );

        assertThat(plan.selection().totalPrice()).isLessThanOrEqualTo(new BigDecimal("6500"));
        assertThat(plan.selection().get(IntelligenceCategory.GPU).orElseThrow().id())
                .isEqualTo(input.get(IntelligenceCategory.GPU).orElseThrow().id());
        assertThat(plan.unresolvedBudget()).isEqualByComparingTo("0");
    }

    @Test
    void exposesAnUnresolvedShortfallWhenTheCatalogueHasNoCheaperSolution() {
        BuildSelection input = compatibleBuild();

        BuildOptimizationPlan plan = optimizer.optimize(
                input,
                catalogue(input),
                new BigDecimal("5000"),
                OptimizationGoal.BALANCED,
                CompatibilityRuleDefinition.standardRules()
        );

        assertThat(plan.changed()).isFalse();
        assertThat(plan.unresolvedBudget()).isEqualByComparingTo("3000.00");
    }

    private static Map<IntelligenceCategory, List<HardwareFacts>> catalogue(
            BuildSelection selection,
            HardwareFacts... extras
    ) {
        EnumMap<IntelligenceCategory, List<HardwareFacts>> result =
                new EnumMap<>(IntelligenceCategory.class);
        selection.components().forEach((category, facts) ->
                result.put(category, new ArrayList<>(List.of(facts))));
        for (HardwareFacts extra : extras) {
            result.computeIfAbsent(extra.category(), ignored -> new ArrayList<>()).add(extra);
        }
        return result;
    }

    private static HardwareFacts cheaper(
            BuildSelection input,
            IntelligenceCategory category,
            String id,
            String price
    ) {
        HardwareFacts current = input.get(category).orElseThrow();
        return variant(current, id, id, price, current.performance());
    }

    private static HardwareFacts variant(
            HardwareFacts source,
            String id,
            String name,
            String price,
            PerformanceProfile performance
    ) {
        return new HardwareFacts(
                id,
                name,
                source.brand(),
                source.category(),
                new BigDecimal(price),
                source.powerWatt(),
                performance,
                source.specification(),
                source.modelUrl(),
                source.modelVariant()
        );
    }
}
