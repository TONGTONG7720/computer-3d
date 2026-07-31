package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.algorithm.BestPriceAlgorithm;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.vo.PriceComparisonView;
import com.pclab.hardware.service.HardwareQueryService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;

class PriceComparisonServiceTest {

    @Test
    void separatesInternalReferenceFromMarketplaceRanking() {
        HardwareQueryService hardwareService = mock(HardwareQueryService.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductPriceMapper priceMapper = mock(ProductPriceMapper.class);
        HardwareEntity hardware = hardware();
        when(hardwareService.requireHardware("gpu-nvidia-rtx5090")).thenReturn(hardware);
        when(productMapper.selectActiveByHardwareId(1L)).thenReturn(List.of(
                product(10L, "MANUAL", "0.99"),
                product(11L, "MANUAL", "0.98"),
                product(12L, "INTERNAL", "1.00")
        ));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        when(priceMapper.selectByHardwareId(1L)).thenReturn(List.of(
                offer(101L, 10L, "JD", "SELF_OPERATED", "9299", 12000, "4.9", "98", now),
                offer(102L, 11L, "PDD", "MARKETPLACE", "8799", 1800, "4.5", "80", now),
                offer(103L, 12L, "INTERNAL", "INTERNAL", "13999", 0, "0", "100", now)
        ));
        PriceComparisonService service = new PriceComparisonService(
                hardwareService,
                productMapper,
                priceMapper,
                new BestPriceAlgorithm()
        );

        PriceComparisonView result = service.compareHardware("gpu-nvidia-rtx5090");

        assertThat(result.internalReferencePrice()).isEqualByComparingTo("13999");
        assertThat(result.lowestPrice()).isEqualByComparingTo("8799");
        assertThat(result.lowestOfferId()).isEqualTo(102L);
        assertThat(result.recommendedOfferId()).isEqualTo(101L);
        assertThat(result.offers()).hasSize(2);
    }

    @Test
    void excludesLowConfidenceAndZeroPriceOffersBeforeRanking() {
        HardwareQueryService hardwareService = mock(HardwareQueryService.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductPriceMapper priceMapper = mock(ProductPriceMapper.class);
        HardwareEntity hardware = hardware();
        when(hardwareService.requireHardware("gpu-nvidia-rtx5090")).thenReturn(hardware);
        when(productMapper.selectActiveByHardwareId(1L)).thenReturn(List.of(
                product(10L, "MANUAL", "0.99"),
                product(11L, "MANUAL", "0.79"),
                product(12L, "MANUAL", "0.99")
        ));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        when(priceMapper.selectByHardwareId(1L)).thenReturn(List.of(
                offer(101L, 10L, "JD", "SELF_OPERATED", "9299", 12000, "4.9", "98", now),
                offer(102L, 11L, "PDD", "MARKETPLACE", "1", 1800, "4.5", "80", now),
                offer(103L, 12L, "TAOBAO", "BRAND_STORE", "0", 6500, "4.8", "91", now)
        ));
        PriceComparisonService service = new PriceComparisonService(
                hardwareService,
                productMapper,
                priceMapper,
                new BestPriceAlgorithm()
        );

        PriceComparisonView result = service.compareHardware("gpu-nvidia-rtx5090");

        assertThat(result.lowestPrice()).isEqualByComparingTo("9299");
        assertThat(result.offers()).extracting(PriceComparisonView.OfferView::id)
                .containsExactly(101L);
    }

    private static HardwareEntity hardware() {
        HardwareEntity hardware = new HardwareEntity();
        hardware.setId(1L);
        hardware.setHardwareKey("gpu-nvidia-rtx5090");
        hardware.setName("NVIDIA GeForce RTX 5090");
        return hardware;
    }

    private static ProductEntity product(Long id, String source, String confidence) {
        ProductEntity product = new ProductEntity();
        product.setId(id);
        product.setTitle("RTX 5090");
        product.setMatchConfidence(new BigDecimal(confidence));
        product.setMatchStatus("CONFIRMED");
        product.setStatus("ACTIVE");
        product.setRecordSource(source);
        product.setDeleted(0);
        return product;
    }

    private static ProductPriceEntity offer(
            Long id,
            Long productId,
            String platform,
            String shopType,
            String price,
            int sales,
            String rating,
            String sellerScore,
            LocalDateTime checkedAt
    ) {
        ProductPriceEntity offer = new ProductPriceEntity();
        offer.setId(id);
        offer.setProductId(productId);
        offer.setPlatform(platform);
        offer.setSeller(platform + " seller");
        offer.setShopType(shopType);
        offer.setSalePrice(new BigDecimal(price));
        offer.setFinalPrice(new BigDecimal(price));
        offer.setShippingFee(BigDecimal.ZERO);
        offer.setCouponAmount(BigDecimal.ZERO);
        offer.setFullReductionAmount(BigDecimal.ZERO);
        offer.setMemberDiscountAmount(BigDecimal.ZERO);
        offer.setPlatformSubsidyAmount(BigDecimal.ZERO);
        offer.setSalesCount(sales);
        offer.setRating(new BigDecimal(rating));
        offer.setSellerScore(new BigDecimal(sellerScore));
        offer.setStockStatus("IN_STOCK");
        offer.setRecordSource("MANUAL");
        offer.setIsEnabled(1);
        offer.setIsReviewed(1);
        offer.setProductUrl("https://example.com/item");
        offer.setCheckedAt(checkedAt);
        return offer;
    }
}
