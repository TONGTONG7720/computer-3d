package com.pclab.hardware.price.service;

import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.algorithm.BestPriceAlgorithm;
import com.pclab.hardware.price.domain.PlatformCode;
import com.pclab.hardware.price.domain.PriceRanking;
import com.pclab.hardware.price.domain.PriceRanking.RankableOffer;
import com.pclab.hardware.price.domain.PriceRanking.ScoredOffer;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.vo.BuildQuoteView;
import com.pclab.hardware.price.vo.PriceComparisonView;
import com.pclab.hardware.price.vo.PriceComparisonView.OfferView;
import com.pclab.hardware.price.vo.PriceComparisonView.PriceRange;
import com.pclab.hardware.service.HardwareQueryService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PriceComparisonService {

    static final String DISCLOSURE = "V1 为人工维护报价，演示数据非实时；购买前请在平台核验价格与库存。";
    private static final BigDecimal MIN_MATCH_CONFIDENCE = new BigDecimal("0.80");

    private final HardwareQueryService hardwareService;
    private final ProductMapper productMapper;
    private final ProductPriceMapper priceMapper;
    private final BestPriceAlgorithm rankingAlgorithm;

    public PriceComparisonService(
            HardwareQueryService hardwareService,
            ProductMapper productMapper,
            ProductPriceMapper priceMapper,
            BestPriceAlgorithm rankingAlgorithm
    ) {
        this.hardwareService = hardwareService;
        this.productMapper = productMapper;
        this.priceMapper = priceMapper;
        this.rankingAlgorithm = rankingAlgorithm;
    }

    @Cacheable(cacheNames = "price-comparison", key = "#idOrKey")
    public PriceComparisonView compareHardware(String idOrKey) {
        HardwareEntity hardware = hardwareService.requireHardware(idOrKey);
        Map<Long, ProductEntity> products = productMapper.selectActiveByHardwareId(hardware.getId())
                .stream()
                .collect(Collectors.toUnmodifiableMap(ProductEntity::getId, Function.identity()));
        List<ProductPriceEntity> allOffers = priceMapper.selectByHardwareId(hardware.getId());
        BigDecimal internalReference = allOffers.stream()
                .filter(offer -> "INTERNAL".equals(offer.getPlatform()))
                .map(ProductPriceEntity::getFinalPrice)
                .min(Comparator.naturalOrder())
                .orElse(null);
        List<ProductPriceEntity> marketOffers = allOffers.stream()
                .filter(offer -> isEligible(offer, products.get(offer.getProductId())))
                .toList();
        return assembleComparison(hardware, products, marketOffers, internalReference);
    }

    @Cacheable(cacheNames = "price-build", key = "#hardwareKeys.toString()")
    public BuildQuoteView quote(List<String> hardwareKeys) {
        List<BuildQuoteView.ComponentQuote> components = hardwareKeys.stream()
                .distinct()
                .map(this::compareHardware)
                .map(this::toComponentQuote)
                .toList();
        BigDecimal lowestTotal = components.stream()
                .map(component -> preferred(component.lowestPrice(), component.internalReferencePrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal recommendedTotal = components.stream()
                .map(component -> preferred(component.recommendedPrice(), component.internalReferencePrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int priced = (int) components.stream()
                .filter(component -> component.lowestPrice() != null)
                .count();
        return new BuildQuoteView(
                components,
                lowestTotal,
                recommendedTotal,
                priced,
                components.size(),
                priced == components.size(),
                DISCLOSURE,
                LocalDateTime.now(ZoneOffset.UTC)
        );
    }

    private PriceComparisonView assembleComparison(
            HardwareEntity hardware,
            Map<Long, ProductEntity> products,
            List<ProductPriceEntity> offers,
            BigDecimal internalReference
    ) {
        if (offers.isEmpty()) {
            return emptyComparison(hardware, internalReference);
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        PriceRanking ranking = rankingAlgorithm.rank(
                offers.stream().map(this::toRankable).toList(),
                now
        );
        Map<Long, ScoredOffer> scores = ranking.orderedOffers().stream()
                .collect(Collectors.toUnmodifiableMap(item -> item.offer().id(), Function.identity()));
        List<OfferView> views = offers.stream()
                .map(offer -> toOfferView(offer, products.get(offer.getProductId()), scores.get(offer.getId())))
                .sorted(Comparator.comparing(OfferView::finalPrice))
                .toList();
        BigDecimal min = views.getFirst().finalPrice();
        BigDecimal max = views.getLast().finalPrice();
        LocalDateTime updatedAt = offers.stream()
                .map(ProductPriceEntity::getCheckedAt)
                .max(Comparator.naturalOrder())
                .orElse(now);
        return new PriceComparisonView(
                hardware.getHardwareKey(),
                hardware.getName(),
                internalReference,
                ranking.lowest().finalPrice(),
                ranking.lowest().id(),
                ranking.recommended().id(),
                ranking.recommendedReason(),
                new PriceRange(min, max),
                views,
                "MANUAL",
                DISCLOSURE,
                updatedAt
        );
    }

    private static boolean isEligible(ProductPriceEntity offer, ProductEntity product) {
        return product != null
                && "CONFIRMED".equals(product.getMatchStatus())
                && product.getMatchConfidence() != null
                && product.getMatchConfidence().compareTo(MIN_MATCH_CONFIDENCE) >= 0
                && !"INTERNAL".equals(offer.getPlatform())
                && offer.getIsEnabled() == 1
                && offer.getIsReviewed() == 1
                && "IN_STOCK".equals(offer.getStockStatus())
                && offer.getFinalPrice() != null
                && offer.getFinalPrice().signum() > 0
                && offer.getCheckedAt() != null
                && hasRedirect(offer);
    }

    private static boolean hasRedirect(ProductPriceEntity offer) {
        return (offer.getAffiliateUrl() != null && !offer.getAffiliateUrl().isBlank())
                || (offer.getProductUrl() != null && !offer.getProductUrl().isBlank());
    }

    private RankableOffer toRankable(ProductPriceEntity offer) {
        return new RankableOffer(
                offer.getId(),
                PlatformCode.from(offer.getPlatform()),
                offer.getSeller(),
                offer.getShopType(),
                offer.getFinalPrice(),
                offer.getSalesCount(),
                offer.getRating(),
                offer.getSellerScore(),
                offer.getDeliveryScore(),
                offer.getCheckedAt(),
                offer.getRecordSource()
        );
    }

    private static OfferView toOfferView(
            ProductPriceEntity offer,
            ProductEntity product,
            ScoredOffer score
    ) {
        BigDecimal discount = offer.getSalePrice()
                .subtract(offer.getFinalPrice().subtract(offer.getShippingFee()))
                .max(BigDecimal.ZERO);
        return new OfferView(
                offer.getId(),
                offer.getPlatform(),
                PlatformCode.from(offer.getPlatform()).label(),
                offer.getSeller(),
                offer.getShopType(),
                offer.getSalePrice(),
                discount,
                offer.getShippingFee(),
                offer.getFinalPrice(),
                offer.getRating(),
                offer.getSalesCount(),
                offer.getSellerScore(),
                score.totalScore(),
                product.getMatchConfidence(),
                score.stale(),
                tags(offer),
                "/api/price-intelligence/offers/" + offer.getId() + "/go",
                offer.getRecordSource()
        );
    }

    private static List<String> tags(ProductPriceEntity offer) {
        List<String> tags = new ArrayList<>();
        if ("SELF_OPERATED".equals(offer.getShopType())) {
            tags.add("自营");
        }
        if ("BRAND_STORE".equals(offer.getShopType())) {
            tags.add("品牌店");
        }
        if (offer.getCouponAmount().signum() > 0) {
            tags.add("优惠券");
        }
        if (offer.getPlatformSubsidyAmount().signum() > 0) {
            tags.add("平台补贴");
        }
        return tags;
    }

    private static PriceComparisonView emptyComparison(
            HardwareEntity hardware,
            BigDecimal internalReference
    ) {
        return new PriceComparisonView(
                hardware.getHardwareKey(),
                hardware.getName(),
                internalReference,
                null,
                null,
                null,
                "暂无已审核且可购买的平台报价",
                null,
                List.of(),
                "MANUAL",
                DISCLOSURE,
                LocalDateTime.now(ZoneOffset.UTC)
        );
    }

    private BuildQuoteView.ComponentQuote toComponentQuote(PriceComparisonView comparison) {
        OfferView recommended = comparison.offers().stream()
                .filter(offer -> offer.id().equals(comparison.recommendedOfferId()))
                .findFirst()
                .orElse(null);
        return new BuildQuoteView.ComponentQuote(
                comparison.hardwareKey(),
                comparison.hardwareName(),
                comparison.internalReferencePrice(),
                comparison.lowestPrice(),
                recommended == null ? null : recommended.finalPrice(),
                comparison.recommendedOfferId()
        );
    }

    private static BigDecimal preferred(BigDecimal marketPrice, BigDecimal internalPrice) {
        if (marketPrice != null) {
            return marketPrice;
        }
        return internalPrice == null ? BigDecimal.ZERO : internalPrice;
    }
}
