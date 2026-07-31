package com.pclab.hardware.security;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private String adminKey = "";

    @Min(1)
    private int publicRateLimitPerMinute = 120;

    @Min(1)
    private int adminRateLimitPerMinute = 60;

    public String getAdminKey() {
        return adminKey;
    }

    public void setAdminKey(String adminKey) {
        this.adminKey = adminKey;
    }

    public int getPublicRateLimitPerMinute() {
        return publicRateLimitPerMinute;
    }

    public void setPublicRateLimitPerMinute(int publicRateLimitPerMinute) {
        this.publicRateLimitPerMinute = publicRateLimitPerMinute;
    }

    public int getAdminRateLimitPerMinute() {
        return adminRateLimitPerMinute;
    }

    public void setAdminRateLimitPerMinute(int adminRateLimitPerMinute) {
        this.adminRateLimitPerMinute = adminRateLimitPerMinute;
    }
}
