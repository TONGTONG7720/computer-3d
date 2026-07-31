package com.pclab.hardware.price.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.price")
public class PriceProperties {

    @NotBlank
    @Size(min = 16)
    private String analyticsHashKey = "pc-lab-local-development-key";

    private Map<String, List<String>> redirectHosts = Map.of();

    public String getAnalyticsHashKey() {
        return analyticsHashKey;
    }

    public void setAnalyticsHashKey(String analyticsHashKey) {
        this.analyticsHashKey = analyticsHashKey;
    }

    public Map<String, List<String>> getRedirectHosts() {
        return redirectHosts;
    }

    public void setRedirectHosts(Map<String, List<String>> redirectHosts) {
        this.redirectHosts = Map.copyOf(redirectHosts);
    }

    public Set<String> allowedHosts(String platform) {
        return redirectHosts.getOrDefault(platform.toUpperCase(Locale.ROOT), List.of()).stream()
                .map(host -> host.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }
}
