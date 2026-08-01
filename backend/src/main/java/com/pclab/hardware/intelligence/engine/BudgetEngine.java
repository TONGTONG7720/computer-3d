package com.pclab.hardware.intelligence.engine;

import com.pclab.hardware.intelligence.domain.BudgetReport;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

@Component
public class BudgetEngine {

    private static final BigDecimal NEAR_LIMIT_RATIO = new BigDecimal("0.90");

    public BudgetReport calculate(BigDecimal limit, BigDecimal current) {
        requireNonNegative("limit", limit);
        requireNonNegative("current", current);

        BigDecimal normalizedLimit = limit.setScale(2, RoundingMode.HALF_UP);
        BigDecimal normalizedCurrent = current.setScale(2, RoundingMode.HALF_UP);
        BigDecimal difference = normalizedLimit.subtract(normalizedCurrent);
        BigDecimal remaining = difference.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal overage = difference.negate().max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        BudgetReport.Status status;
        if (normalizedCurrent.compareTo(normalizedLimit) > 0) {
            status = BudgetReport.Status.OVER;
        } else if (normalizedLimit.signum() > 0
                && normalizedCurrent.compareTo(normalizedLimit.multiply(NEAR_LIMIT_RATIO)) >= 0) {
            status = BudgetReport.Status.NEAR_LIMIT;
        } else {
            status = BudgetReport.Status.WITHIN;
        }

        BigDecimal utilization = normalizedLimit.signum() == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : normalizedCurrent.multiply(new BigDecimal("100"))
                        .divide(normalizedLimit, 2, RoundingMode.HALF_UP);

        return new BudgetReport(
                status,
                normalizedLimit,
                normalizedCurrent,
                remaining,
                overage,
                utilization
        );
    }

    private static void requireNonNegative(String name, BigDecimal value) {
        if (value == null || value.signum() < 0) {
            throw new IllegalArgumentException(name + " must be non-negative");
        }
    }
}
