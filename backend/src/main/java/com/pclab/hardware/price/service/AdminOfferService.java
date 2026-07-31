package com.pclab.hardware.price.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.algorithm.PromotionCalculator;
import com.pclab.hardware.price.algorithm.PromotionCalculator.PromotionInput;
import com.pclab.hardware.price.dto.AdminPriceRequests.UpsertOfferRequest;
import com.pclab.hardware.price.entity.PriceHistoryEntity;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.PriceHistoryMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.vo.AdminPriceViews.OfferAdminView;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOfferService {

    private final ProductMapper productMapper;
    private final ProductPriceMapper priceMapper;
    private final PriceHistoryMapper historyMapper;
    private final PromotionCalculator promotionCalculator;
    private final PriceLinkPolicy linkPolicy;

    public AdminOfferService(
            ProductMapper productMapper,
            ProductPriceMapper priceMapper,
            PriceHistoryMapper historyMapper,
            PromotionCalculator promotionCalculator,
            PriceLinkPolicy linkPolicy
    ) {
        this.productMapper = productMapper;
        this.priceMapper = priceMapper;
        this.historyMapper = historyMapper;
        this.promotionCalculator = promotionCalculator;
        this.linkPolicy = linkPolicy;
    }

    @Transactional
    @PriceCacheEviction
    public OfferAdminView createOffer(Long productId, UpsertOfferRequest request) {
        requireProduct(productId);
        long duplicates = priceMapper.selectCount(
                Wrappers.<ProductPriceEntity>lambdaQuery()
                        .eq(ProductPriceEntity::getProductId, productId)
                        .eq(ProductPriceEntity::getPlatform, request.platform())
                        .eq(ProductPriceEntity::getSeller, request.seller())
        );
        if (duplicates > 0) {
            throw new DomainException(ErrorCode.CONFLICT, "该平台和商家的报价已存在");
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        ProductPriceEntity offer = new ProductPriceEntity();
        offer.setProductId(productId);
        offer.setCreatedAt(now);
        offer.setVersion(1);
        applyRequest(offer, request, now);
        priceMapper.insert(offer);
        insertHistory(offer, now);
        return toView(offer, now);
    }

    @Transactional
    @PriceCacheEviction
    public OfferAdminView updateOffer(Long offerId, UpsertOfferRequest request) {
        ProductPriceEntity offer = requireOffer(offerId);
        if (request.version() == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "更新报价必须提交 version");
        }
        BigDecimal previousFinalPrice = offer.getFinalPrice();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        offer.setVersion(request.version());
        applyRequest(offer, request, now);
        if (priceMapper.updateById(offer) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        if (previousFinalPrice.compareTo(offer.getFinalPrice()) != 0) {
            insertHistory(offer, now);
        }
        return toView(offer, now);
    }

    @Transactional
    @PriceCacheEviction
    public void disableOffer(Long offerId) {
        ProductPriceEntity offer = requireOffer(offerId);
        offer.setIsEnabled(0);
        offer.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        priceMapper.updateById(offer);
    }

    @Transactional(readOnly = true)
    public List<OfferAdminView> offersForProduct(Long productId) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        return priceMapper.selectList(
                        Wrappers.<ProductPriceEntity>lambdaQuery()
                                .eq(ProductPriceEntity::getProductId, productId)
                                .orderByAsc(ProductPriceEntity::getFinalPrice)
                ).stream()
                .map(offer -> toView(offer, now))
                .toList();
    }

    private void applyRequest(
            ProductPriceEntity offer,
            UpsertOfferRequest request,
            LocalDateTime now
    ) {
        BigDecimal finalPrice = promotionCalculator.finalPrice(new PromotionInput(
                request.salePrice(),
                request.couponAmount(),
                request.fullReductionAmount(),
                request.memberDiscountAmount(),
                request.platformSubsidyAmount(),
                request.shippingFee()
        ));
        linkPolicy.validateDraftLinks(
                request.platform(),
                request.affiliateUrl(),
                request.productUrl(),
                request.reviewed()
        );
        offer.setPlatform(request.platform());
        offer.setSeller(request.seller().trim());
        offer.setShopType(request.shopType());
        offer.setSalePrice(request.salePrice());
        offer.setCouponAmount(request.couponAmount());
        offer.setFullReductionAmount(request.fullReductionAmount());
        offer.setMemberDiscountAmount(request.memberDiscountAmount());
        offer.setPlatformSubsidyAmount(request.platformSubsidyAmount());
        offer.setShippingFee(request.shippingFee());
        offer.setFinalPrice(finalPrice);
        offer.setSalesCount(request.salesCount());
        offer.setRating(request.rating());
        offer.setSellerScore(request.sellerScore());
        offer.setCurrency(request.currency());
        offer.setStockStatus(request.stockStatus());
        offer.setPromotionJson("{}");
        offer.setProductUrl(emptyIfNull(request.productUrl()));
        offer.setAffiliateUrl(emptyIfNull(request.affiliateUrl()));
        offer.setRecordSource("MANUAL");
        offer.setIsEnabled(request.enabled() ? 1 : 0);
        offer.setIsReviewed(request.reviewed() ? 1 : 0);
        offer.setCheckedAt(now);
        offer.setUpdatedAt(now);
    }

    private void insertHistory(ProductPriceEntity offer, LocalDateTime now) {
        PriceHistoryEntity history = new PriceHistoryEntity();
        history.setProductId(offer.getProductId());
        history.setOfferId(offer.getId());
        history.setPlatform(offer.getPlatform());
        history.setSalePrice(offer.getSalePrice());
        history.setFinalPrice(offer.getFinalPrice());
        history.setCurrency(offer.getCurrency());
        history.setStockStatus(offer.getStockStatus());
        history.setRecordSource(offer.getRecordSource());
        history.setRecordedAt(now);
        history.setCreatedAt(now);
        historyMapper.insert(history);
    }

    private ProductEntity requireProduct(Long productId) {
        ProductEntity product = productMapper.selectById(productId);
        if (product == null) {
            throw new DomainException(ErrorCode.PRICE_PRODUCT_NOT_FOUND);
        }
        return product;
    }

    private ProductPriceEntity requireOffer(Long offerId) {
        ProductPriceEntity offer = priceMapper.selectById(offerId);
        if (offer == null) {
            throw new DomainException(ErrorCode.PRICE_OFFER_NOT_FOUND);
        }
        return offer;
    }

    public static OfferAdminView toView(ProductPriceEntity offer, LocalDateTime now) {
        return new OfferAdminView(
                offer.getId(),
                offer.getProductId(),
                offer.getPlatform(),
                offer.getSeller(),
                offer.getShopType(),
                offer.getSalePrice(),
                offer.getCouponAmount(),
                offer.getFullReductionAmount(),
                offer.getMemberDiscountAmount(),
                offer.getPlatformSubsidyAmount(),
                offer.getShippingFee(),
                offer.getFinalPrice(),
                offer.getSalesCount(),
                offer.getRating(),
                offer.getSellerScore(),
                offer.getCurrency(),
                offer.getStockStatus(),
                offer.getProductUrl(),
                offer.getAffiliateUrl(),
                offer.getRecordSource(),
                offer.getIsEnabled() == 1,
                offer.getIsReviewed() == 1,
                offer.getVersion(),
                offer.getCheckedAt().isBefore(now.minusHours(24)),
                offer.getCheckedAt()
        );
    }

    private static String emptyIfNull(String value) {
        return value == null ? "" : value.trim();
    }

    @CacheEvict(
            cacheNames = {
                    "prices",
                    "price-comparison",
                    "price-history",
                    "price-build",
                    "price-admin"
            },
            allEntries = true
    )
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    private @interface PriceCacheEviction {
    }
}
