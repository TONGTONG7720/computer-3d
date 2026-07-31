package com.pclab.hardware.price.service;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.config.PriceProperties;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class PriceLinkPolicy {

    private final PriceProperties properties;

    public PriceLinkPolicy(PriceProperties properties) {
        this.properties = properties;
    }

    public URI reviewedTarget(
            String platform,
            String affiliateUrl,
            String productUrl
    ) {
        String storedUrl = affiliateUrl != null && !affiliateUrl.isBlank()
                ? affiliateUrl
                : productUrl;
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
        if (!secure || !allowed(host, properties.allowedHosts(platform))) {
            throw new DomainException(ErrorCode.PRICE_REDIRECT_BLOCKED);
        }
        return target;
    }

    public void validateDraftLinks(
            String platform,
            String affiliateUrl,
            String productUrl,
            boolean reviewed
    ) {
        boolean hasLink = (affiliateUrl != null && !affiliateUrl.isBlank())
                || (productUrl != null && !productUrl.isBlank());
        if (reviewed || hasLink) {
            reviewedTarget(platform, affiliateUrl, productUrl);
        }
    }

    private static boolean allowed(String host, Set<String> allowlist) {
        String normalized = host.toLowerCase(Locale.ROOT);
        return allowlist.stream().anyMatch(
                allowed -> normalized.equals(allowed) || normalized.endsWith("." + allowed)
        );
    }
}
