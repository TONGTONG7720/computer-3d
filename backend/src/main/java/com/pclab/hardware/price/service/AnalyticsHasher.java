package com.pclab.hardware.price.service;

import com.pclab.hardware.price.config.PriceProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsHasher {

    private final byte[] salt;

    public AnalyticsHasher(PriceProperties properties) {
        this.salt = properties.getAnalyticsHashKey().getBytes(StandardCharsets.UTF_8);
    }

    public String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt);
            digest.update((byte) 0);
            return HexFormat.of().formatHex(
                    digest.digest((value == null ? "" : value).getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
