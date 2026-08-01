package com.pclab.hardware.price.adapter;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.domain.PlatformCode;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JdAllianceAdapter implements PlatformAdapter {

    private final boolean enabled;

    public JdAllianceAdapter(
            @Value("${app.price.jd.enabled:false}") boolean enabled,
            @Value("${app.price.jd.app-key:}") String appKey,
            @Value("${app.price.jd.app-secret:}") String appSecret
    ) {
        this.enabled = enabled && hasText(appKey) && hasText(appSecret);
    }

    @Override
    public String adapterCode() {
        return "jd-alliance";
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public Set<PlatformCode> supportedPlatforms() {
        return Set.of(PlatformCode.JD);
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
