package com.pclab.hardware.price.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class AdminPriceRequests {

    private AdminPriceRequests() {
    }

    public record UpsertProductRequest(
            @NotBlank @Size(max = 500) String title,
            @NotBlank @Size(max = 80) String brand,
            @NotBlank @Size(max = 160) String model,
            @NotBlank @Size(max = 32) String category,
            @Size(max = 500) String imageUrl,
            @Size(max = 2000) String description,
            Long hardwareId,
            @Pattern(regexp = "ACTIVE|DRAFT|DISABLED") String status,
            @Min(1) Integer version
    ) {
    }

    public record MatchPreviewRequest(
            @NotBlank @Size(max = 500) String title,
            @NotBlank @Size(max = 80) String brand,
            @NotBlank @Size(max = 160) String model,
            @NotBlank @Size(max = 32) String category,
            @NotNull Long hardwareId
    ) {
    }

    public record ConfirmMatchRequest(
            @NotNull Long hardwareId,
            @NotBlank @Size(max = 80) String reviewedBy,
            @Min(1) Integer version
    ) {
    }

    public record UpsertOfferRequest(
            @NotBlank
            @Pattern(regexp = "JD|TAOBAO|PDD|TMALL|AMAZON|SUNING")
            String platform,
            @NotBlank @Size(max = 120) String seller,
            @NotBlank
            @Pattern(regexp = "SELF_OPERATED|BRAND_STORE|MARKETPLACE")
            String shopType,
            @NotNull @DecimalMin("0") BigDecimal salePrice,
            @NotNull @DecimalMin("0") BigDecimal couponAmount,
            @NotNull @DecimalMin("0") BigDecimal fullReductionAmount,
            @NotNull @DecimalMin("0") BigDecimal memberDiscountAmount,
            @NotNull @DecimalMin("0") BigDecimal platformSubsidyAmount,
            @NotNull @DecimalMin("0") BigDecimal shippingFee,
            @Min(0) int salesCount,
            @NotNull @DecimalMin("0") @DecimalMax("5") BigDecimal rating,
            @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal sellerScore,
            @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
            @NotBlank
            @Pattern(regexp = "IN_STOCK|OUT_OF_STOCK|PREORDER")
            String stockStatus,
            @Size(max = 1000) String productUrl,
            @Size(max = 1000) String affiliateUrl,
            boolean enabled,
            boolean reviewed,
            @Min(1) Integer version
    ) {
    }

    public record ProductListQuery(
            String keyword,
            String platform,
            String status,
            String category,
            String matchStatus,
            @Min(1) int page,
            @Min(1) @Max(50) int size
    ) {
    }
}
