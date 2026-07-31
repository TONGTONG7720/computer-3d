package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.config.AiProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class AiMessageHasher {

    private final byte[] key;

    public AiMessageHasher(AiProperties properties) {
        this.key = properties.getAnalyticsHashKey().getBytes(StandardCharsets.UTF_8);
    }

    public String hash(String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable", exception);
        }
    }
}
