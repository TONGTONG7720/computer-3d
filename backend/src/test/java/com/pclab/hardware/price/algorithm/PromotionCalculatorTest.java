package com.pclab.hardware.price.algorithm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.algorithm.PromotionCalculator.PromotionInput;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PromotionCalculatorTest {

    private final PromotionCalculator calculator = new PromotionCalculator();

    @Test
    void calculatesEverySupportedDiscountIntoFinalPrice() {
        PromotionInput input = new PromotionInput(
                amount("9499"),
                amount("100"),
                amount("200"),
                amount("50"),
                amount("150"),
                amount("0")
        );

        BigDecimal result = calculator.finalPrice(input);

        assertThat(result).isEqualByComparingTo("8999");
    }

    @Test
    void rejectsDiscountsThatExceedSalePrice() {
        PromotionInput input = new PromotionInput(
                amount("100"),
                amount("80"),
                amount("30"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        assertThatThrownBy(() -> calculator.finalPrice(input))
                .isInstanceOf(DomainException.class)
                .extracting(error -> ((DomainException) error).errorCode())
                .isEqualTo(ErrorCode.PRICE_PROMOTION_INVALID);
    }

    private static BigDecimal amount(String value) {
        return new BigDecimal(value);
    }
}
