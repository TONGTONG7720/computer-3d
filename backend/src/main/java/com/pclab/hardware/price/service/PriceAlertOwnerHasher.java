package com.pclab.hardware.price.service;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.config.PriceProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class PriceAlertOwnerHasher {

    private static final byte[] DOMAIN = "price-alert-owner"
            .getBytes(StandardCharsets.UTF_8);

    private final byte[] salt;

    public PriceAlertOwnerHasher(PriceProperties properties) {
        this.salt = properties.getAnalyticsHashKey().getBytes(StandardCharsets.UTF_8);
    }

    public String hash(String ownerToken) {
        String normalized = normalize(ownerToken);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt);
            digest.update((byte) 0);
            digest.update(DOMAIN);
            digest.update((byte) 0);
            return HexFormat.of().formatHex(
                    digest.digest(normalized.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private static String normalize(String ownerToken) {
        try {
            String normalized = UUID.fromString(ownerToken).toString();
            if (!normalized.equalsIgnoreCase(ownerToken)) {
                throw invalidOwner();
            }
            return normalized;
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw invalidOwner();
        }
    }

    private static DomainException invalidOwner() {
        return new DomainException(
                ErrorCode.VALIDATION_FAILED,
                "价格提醒所有者标识无效"
        );
    }
}
