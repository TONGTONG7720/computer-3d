package com.pclab.hardware.intelligence.engine;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.intelligence.domain.BudgetReport;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class BudgetEngineTest {

    private final BudgetEngine engine = new BudgetEngine();

    @Test
    void distinguishesWithinNearLimitAndOverBudgetStates() {
        BudgetReport within = engine.calculate(money("10000"), money("7000"));
        BudgetReport near = engine.calculate(money("10000"), money("9000"));
        BudgetReport over = engine.calculate(money("10000"), money("12000"));

        assertThat(within.status()).isEqualTo(BudgetReport.Status.WITHIN);
        assertThat(near.status()).isEqualTo(BudgetReport.Status.NEAR_LIMIT);
        assertThat(near.remaining()).isEqualByComparingTo("1000.00");
        assertThat(over.status()).isEqualTo(BudgetReport.Status.OVER);
        assertThat(over.overage()).isEqualByComparingTo("2000.00");
        assertThat(over.remaining()).isEqualByComparingTo("0.00");
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}
