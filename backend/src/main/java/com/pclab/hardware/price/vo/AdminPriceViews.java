package com.pclab.hardware.price.vo;

import com.pclab.hardware.price.domain.ProductMatch.MatchDecision;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class AdminPriceViews {

    private AdminPriceViews() {
    }

    public record ProductAdminView(
            Long id,
            String productKey,
            Long hardwareId,
            String title,
            String brand,
            String model,
            String category,
            String imageUrl,
            String description,
            BigDecimal matchConfidence,
            String matchStatus,
            String status,
            String recordSource,
            int version,
            List<OfferAdminView> offers,
            LocalDateTime updatedAt
    ) implements Serializable {

        public ProductAdminView {
            offers = List.copyOf(offers);
        }
    }

    public record OfferAdminView(
            Long id,
            Long productId,
            String platform,
            String seller,
            String shopType,
            BigDecimal salePrice,
            BigDecimal couponAmount,
            BigDecimal fullReductionAmount,
            BigDecimal memberDiscountAmount,
            BigDecimal platformSubsidyAmount,
            BigDecimal shippingFee,
            BigDecimal finalPrice,
            int salesCount,
            BigDecimal rating,
            BigDecimal sellerScore,
            String currency,
            String stockStatus,
            String productUrl,
            String affiliateUrl,
            String recordSource,
            boolean enabled,
            boolean reviewed,
            int version,
            boolean stale,
            LocalDateTime checkedAt
    ) implements Serializable {
    }

    public record MatchPreviewView(
            Long hardwareId,
            String hardwareKey,
            String hardwareName,
            BigDecimal confidence,
            MatchDecision decision,
            Map<String, BigDecimal> dimensionScores,
            List<String> explanations
    ) implements Serializable {

        public MatchPreviewView {
            dimensionScores = Map.copyOf(dimensionScores);
            explanations = List.copyOf(explanations);
        }
    }

    public record AdminDashboardView(
            long activeProducts,
            long validOffers,
            long staleOffers,
            long missingCoverage,
            long clicksLast24Hours,
            List<TopHardwareClickView> topClickedHardware,
            String dataMode,
            LocalDateTime generatedAt
    ) implements Serializable {

        public AdminDashboardView {
            topClickedHardware = List.copyOf(topClickedHardware);
        }
    }

    public record TopHardwareClickView(
            String hardwareKey,
            String hardwareName,
            long clickCount
    ) implements Serializable {
    }
}
