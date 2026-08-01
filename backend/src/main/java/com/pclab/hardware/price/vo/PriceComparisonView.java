package com.pclab.hardware.price.vo;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PriceComparisonView(
        String hardwareKey,
        String hardwareName,
        BigDecimal internalReferencePrice,
        BigDecimal lowestPrice,
        Long lowestOfferId,
        Long recommendedOfferId,
        String recommendedReason,
        PriceRange priceRange,
        List<OfferView> offers,
        String dataMode,
        String disclosure,
        LocalDateTime updatedAt
) implements Serializable {

    public PriceComparisonView {
        offers = List.copyOf(offers);
    }

    public record PriceRange(BigDecimal min, BigDecimal max) implements Serializable {
    }

    public record OfferView(
            Long id,
            String platform,
            String platformLabel,
            String seller,
            String shopType,
            BigDecimal salePrice,
            BigDecimal discount,
            BigDecimal shipping,
            BigDecimal finalPrice,
            BigDecimal rating,
            int salesCount,
            BigDecimal trustScore,
            BigDecimal deliveryScore,
            String deliveryNote,
            BigDecimal rankingScore,
            BigDecimal matchConfidence,
            boolean stale,
            List<String> tags,
            String redirectPath,
            String recordSource
    ) implements Serializable {

        public OfferView {
            tags = List.copyOf(tags);
        }
    }
}
