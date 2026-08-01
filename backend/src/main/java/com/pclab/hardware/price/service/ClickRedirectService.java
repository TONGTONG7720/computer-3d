package com.pclab.hardware.price.service;

import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.entity.PriceClickEventEntity;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.PriceClickEventMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClickRedirectService {

    private final ProductPriceMapper priceMapper;
    private final ProductMapper productMapper;
    private final PriceClickEventMapper eventMapper;
    private final AnalyticsHasher hasher;
    private final PriceLinkPolicy linkPolicy;

    public ClickRedirectService(
            ProductPriceMapper priceMapper,
            ProductMapper productMapper,
            PriceClickEventMapper eventMapper,
            AnalyticsHasher hasher,
            PriceLinkPolicy linkPolicy
    ) {
        this.priceMapper = priceMapper;
        this.productMapper = productMapper;
        this.eventMapper = eventMapper;
        this.hasher = hasher;
        this.linkPolicy = linkPolicy;
    }

    @Transactional
    public URI redirect(Long offerId, ClickContext context) {
        ProductPriceEntity offer = priceMapper.selectById(offerId);
        requirePurchasable(offer);
        ProductEntity product = productMapper.selectById(offer.getProductId());
        if (product == null) {
            throw new DomainException(ErrorCode.PRICE_PRODUCT_NOT_FOUND);
        }
        URI target = linkPolicy.reviewedTarget(
                offer.getPlatform(),
                offer.getAffiliateUrl(),
                offer.getProductUrl()
        );
        PriceClickEventEntity event = new PriceClickEventEntity();
        event.setEventId(UUID.randomUUID().toString());
        event.setOfferId(offer.getId());
        event.setHardwareId(product.getHardwareId());
        event.setPlatform(offer.getPlatform());
        event.setSessionHash(hasher.hash(context.sessionId()));
        event.setBuildPublicId(context.buildPublicId());
        event.setSourceSurface(context.sourceSurface());
        event.setRedirectHost(target.getHost().toLowerCase(java.util.Locale.ROOT));
        event.setIpHash(hasher.hash(context.ipAddress()));
        event.setUserAgentHash(hasher.hash(context.userAgent()));
        event.setClickedAt(LocalDateTime.now(ZoneOffset.UTC));
        eventMapper.insert(event);
        return target;
    }

    private static void requirePurchasable(ProductPriceEntity offer) {
        if (offer == null) {
            throw new DomainException(ErrorCode.PRICE_OFFER_NOT_FOUND);
        }
        boolean purchasable = offer.getIsEnabled() == 1
                && offer.getIsReviewed() == 1
                && "IN_STOCK".equals(offer.getStockStatus())
                && !"INTERNAL".equals(offer.getPlatform());
        if (!purchasable) {
            throw new DomainException(ErrorCode.PRICE_REDIRECT_BLOCKED);
        }
    }

    public record ClickContext(
            String sessionId,
            String buildPublicId,
            String sourceSurface,
            String ipAddress,
            String userAgent
    ) {

        public static ClickContext anonymous() {
            return new ClickContext("", null, "BUILDER", "", "");
        }
    }
}
