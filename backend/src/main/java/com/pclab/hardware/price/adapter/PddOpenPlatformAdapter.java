package com.pclab.hardware.price.adapter;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.domain.PlatformCode;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PddOpenPlatformAdapter implements PlatformAdapter {

    private final boolean enabled;

    public PddOpenPlatformAdapter(
            @Value("${app.price.pdd.enabled:false}") boolean enabled,
            @Value("${app.price.pdd.app-key:}") String appKey,
            @Value("${app.price.pdd.app-secret:}") String appSecret
    ) {
        this.enabled = enabled && hasText(appKey) && hasText(appSecret);
    }

    @Override
    public String adapterCode() {
        return "pdd-open-platform";
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public Set<PlatformCode> supportedPlatforms() {
        return Set.of(PlatformCode.PDD);
    }

    @Override
    public List<PlatformProductCandidate> searchProduct(PlatformSearchRequest request) {
        throw unavailable();
    }

    @Override
    public PlatformPriceSnapshot getPrice(PlatformProductRef reference) {
        throw unavailable();
    }

    @Override
    public PlatformProductDetail getDetail(PlatformProductRef reference) {
        throw unavailable();
    }

    @Override
    public String getSeller(PlatformProductRef reference) {
        throw unavailable();
    }

    @Override
    public String getLink(PlatformProductRef reference) {
        throw unavailable();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static DomainException unavailable() {
        return new DomainException(ErrorCode.PRICE_ADAPTER_UNAVAILABLE);
    }
}
