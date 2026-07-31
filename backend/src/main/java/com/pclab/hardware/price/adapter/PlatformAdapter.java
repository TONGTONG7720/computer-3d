package com.pclab.hardware.price.adapter;

import com.pclab.hardware.price.domain.PlatformCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface PlatformAdapter {

    String adapterCode();

    boolean isEnabled();

    Set<PlatformCode> supportedPlatforms();

    List<PlatformProductCandidate> searchProduct(PlatformSearchRequest request);

    PlatformPriceSnapshot getPrice(PlatformProductRef reference);

    PlatformProductDetail getDetail(PlatformProductRef reference);

    record PlatformSearchRequest(String keyword, String category, Long hardwareId) {
    }

    record PlatformProductRef(Long productId, Long offerId) {
    }

    record PlatformProductCandidate(
            Long productId,
            Long hardwareId,
            String title,
            String brand,
            String model,
            String category,
            BigDecimal matchConfidence
    ) {
    }

    record PlatformPriceSnapshot(
            Long offerId,
            PlatformCode platform,
            BigDecimal salePrice,
            BigDecimal finalPrice,
            String stockStatus,
            LocalDateTime checkedAt
    ) {
    }

    record PlatformProductDetail(
            Long productId,
            String productKey,
            String title,
            String description,
            String imageUrl,
            String recordSource
    ) {
    }
}
