package com.pclab.hardware.price.algorithm;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PromotionCalculator {

    public BigDecimal finalPrice(PromotionInput input) {
        List<BigDecimal> values = List.of(
                input.salePrice(),
                input.couponAmount(),
                input.fullReductionAmount(),
                input.memberDiscountAmount(),
                input.platformSubsidyAmount(),
                input.shippingFee()
        );
        if (values.stream().anyMatch(value -> value.signum() < 0)) {
            throw new DomainException(ErrorCode.PRICE_PROMOTION_INVALID);
        }
        BigDecimal discount = input.couponAmount()
                .add(input.fullReductionAmount())
                .add(input.memberDiscountAmount())
                .add(input.platformSubsidyAmount());
        if (discount.compareTo(input.salePrice()) > 0) {
            throw new DomainException(ErrorCode.PRICE_PROMOTION_INVALID, "优惠总额不能超过商品售价");
        }
        return input.salePrice().subtract(discount).add(input.shippingFee());
    }

    public record PromotionInput(
            BigDecimal salePrice,
            BigDecimal couponAmount,
            BigDecimal fullReductionAmount,
            BigDecimal memberDiscountAmount,
            BigDecimal platformSubsidyAmount,
            BigDecimal shippingFee
    ) {
    }
}
