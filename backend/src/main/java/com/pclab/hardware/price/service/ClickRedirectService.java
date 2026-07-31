package com.pclab.hardware.price.service;

import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.config.PriceProperties;
import com.pclab.hardware.price.entity.PriceClickEventEntity;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.PriceClickEventMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClickRedirectService {

    private final ProductPriceMapper priceMapper;
    private final ProductMapper productMapper;
    private final PriceClickEventMapper eventMapper;
    private final PriceProperties properties;
    private final AnalyticsHasher hasher;

    public ClickRedirectService(
            ProductPriceMapper priceMapper,
            ProductMapper productMapper,
            PriceClickEventMapper eventMapper,
            PriceProperties properties,
            AnalyticsHasher hasher
    ) {
        this.priceMapper = priceMapper;
        this.productMapper = productMapper;
        this.eventMapper = eventMapper;
        this.properties = properties;
        this.hasher = hasher;
    }

    @Transactional
    public URI redirect(Long offerId, ClickContext context) {
        ProductPriceEntity offer = priceMapper.selectById(offerId);
        requirePurchasable(offer);
        ProductEntity product = productMapper.selectById(offer.getProductId());
        if (product == null) {
            throw new DomainException(ErrorCode.PRICE_PRODUCT_NOT_FOUND);
        }
        URI target = reviewedTarget(offer);
        PriceClickEventEntity event = new PriceClickEventEntity();
        event.setOfferId(offer.getId());
        event.setHardwareId(product.getHardwareId());
        event.setPlatform(offer.getPlatform());
        event.setSessionId(hasher.hash(context.sessionId()));
        event.setBuildPublicId(context.buildPublicId());
        event.setSourceSurface(context.sourceSurface());
        event.setRedirectHost(target.getHost().toLowerCase(Locale.ROOT));
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

    private URI reviewedTarget(ProductPriceEntity offer) {
        String storedUrl = offer.getAffiliateUrl() != null && !offer.getAffiliateUrl().isBlank()
                ? offer.getAffiliateUrl()
                : offer.getProductUrl();
        if (storedUrl == null || storedUrl.isBlank()) {
            throw new DomainException(ErrorCode.PRICE_REDIRECT_BLOCKED);
        }
        URI target;
        try {
            target = URI.create(storedUrl);
        } catch (IllegalArgumentException exception) {
            throw new DomainException(ErrorCode.PRICE_REDIRECT_BLOCKED);
        }
        String host = target.getHost();
        boolean secure = "https".equalsIgnoreCase(target.getScheme())
                && host != null
                && target.getUserInfo() == null
                && (target.getPort() == -1 || target.getPort() == 443);
        if (!secure || !allowed(host, properties.allowedHosts(offer.getPlatform()))) {
            throw new DomainException(ErrorCode.PRICE_REDIRECT_BLOCKED);
        }
        return target;
    }

    private static boolean allowed(String host, Set<String> allowlist) {
        String normalized = host.toLowerCase(Locale.ROOT);
        return allowlist.stream().anyMatch(
                allowed -> normalized.equals(allowed) || normalized.endsWith("." + allowed)
        );
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
