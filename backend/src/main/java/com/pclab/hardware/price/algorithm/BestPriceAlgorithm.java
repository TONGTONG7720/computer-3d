package com.pclab.hardware.price.algorithm;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.domain.PriceRanking;
import com.pclab.hardware.price.domain.PriceRanking.RankableOffer;
import com.pclab.hardware.price.domain.PriceRanking.ScoredOffer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class BestPriceAlgorithm {

    private static final BigDecimal PRICE_WEIGHT = new BigDecimal("40");
    private static final BigDecimal SALES_WEIGHT = new BigDecimal("20");
    private static final BigDecimal RATING_WEIGHT = new BigDecimal("20");
    private static final BigDecimal TRUST_WEIGHT = new BigDecimal("20");

    public PriceRanking rank(List<RankableOffer> offers, LocalDateTime now) {
        if (offers.isEmpty()) {
            throw new DomainException(ErrorCode.PRICE_OFFER_NOT_FOUND);
        }
        if (offers.stream().anyMatch(
                offer -> offer.finalPrice() == null || offer.finalPrice().signum() <= 0
        )) {
            throw new DomainException(
                    ErrorCode.PRICE_PROMOTION_INVALID,
                    "参与排序的到手价必须大于 0"
            );
        }
        RankableOffer lowest = offers.stream()
                .min(Comparator.comparing(RankableOffer::finalPrice)
                        .thenComparing(RankableOffer::id))
                .orElseThrow();
        int maxSales = offers.stream().mapToInt(RankableOffer::salesCount).max().orElse(1);
        List<ScoredOffer> ordered = offers.stream()
                .map(offer -> score(offer, lowest.finalPrice(), maxSales, now))
                .sorted(Comparator.comparing(ScoredOffer::totalScore).reversed()
                        .thenComparing(item -> item.offer().finalPrice())
                        .thenComparing(item -> item.offer().id()))
                .toList();
        RankableOffer recommended = ordered.getFirst().offer();
        return new PriceRanking(
                lowest,
                recommended,
                ordered,
                recommendedReason(lowest, recommended)
        );
    }

    private static ScoredOffer score(
            RankableOffer offer,
            BigDecimal lowestPrice,
            int maxSales,
            LocalDateTime now
    ) {
        BigDecimal priceScore = lowestPrice
                .divide(offer.finalPrice(), 8, RoundingMode.HALF_UP)
                .multiply(PRICE_WEIGHT);
        BigDecimal salesScore = maxSales == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(Math.log1p(offer.salesCount()) / Math.log1p(maxSales))
                        .multiply(SALES_WEIGHT);
        BigDecimal ratingScore = offer.rating()
                .divide(new BigDecimal("5"), 8, RoundingMode.HALF_UP)
                .multiply(RATING_WEIGHT);
        BigDecimal trust = offer.sellerScore().add(shopBonus(offer.shopType()))
                .min(new BigDecimal("100"));
        BigDecimal trustScore = trust
                .divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP)
                .multiply(TRUST_WEIGHT);
        boolean stale = offer.checkedAt().isBefore(now.minusHours(48));
        BigDecimal total = priceScore.add(salesScore).add(ratingScore).add(trustScore);
        if (stale) {
            total = total.multiply(new BigDecimal("0.85"));
        }
        return new ScoredOffer(
                offer,
                scaled(total),
                scaled(priceScore),
                scaled(salesScore),
                scaled(ratingScore),
                scaled(trustScore),
                stale
        );
    }

    private static BigDecimal shopBonus(String shopType) {
        return switch (shopType) {
            case "SELF_OPERATED" -> new BigDecimal("8");
            case "BRAND_STORE" -> new BigDecimal("4");
            default -> BigDecimal.ZERO;
        };
    }

    private static String recommendedReason(RankableOffer lowest, RankableOffer recommended) {
        if (lowest.id().equals(recommended.id())) {
            return "综合评分最高，同时也是当前最低价";
        }
        BigDecimal difference = recommended.finalPrice().subtract(lowest.finalPrice());
        BigDecimal percentage = difference
                .divide(lowest.finalPrice(), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
        String channel = "SELF_OPERATED".equals(recommended.shopType()) ? "自营" : "高信誉";
        return "推荐" + recommended.platform().label() + channel
                + "：商家信誉与评价更稳，较最低价价差 ¥"
                + difference.setScale(0, RoundingMode.HALF_UP)
                + "（" + percentage.setScale(1, RoundingMode.HALF_UP) + "%）";
    }

    private static BigDecimal scaled(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
