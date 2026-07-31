package com.pclab.hardware.price.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PriceRanking(
        RankableOffer lowest,
        RankableOffer recommended,
        List<ScoredOffer> orderedOffers,
        String recommendedReason
) {

    public PriceRanking {
        orderedOffers = List.copyOf(orderedOffers);
    }

    public record RankableOffer(
            Long id,
            PlatformCode platform,
            String seller,
            String shopType,
            BigDecimal finalPrice,
            int salesCount,
            BigDecimal rating,
            BigDecimal sellerScore,
            LocalDateTime checkedAt,
            String recordSource
    ) {
    }

    public record ScoredOffer(
            RankableOffer offer,
            BigDecimal totalScore,
            BigDecimal priceScore,
            BigDecimal salesScore,
            BigDecimal ratingScore,
            BigDecimal trustScore,
            boolean stale
    ) {
    }
}
