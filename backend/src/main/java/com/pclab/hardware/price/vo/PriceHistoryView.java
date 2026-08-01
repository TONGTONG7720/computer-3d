package com.pclab.hardware.price.vo;

import com.fasterxml.jackson.annotation.JsonValue;
import com.pclab.hardware.price.domain.PlatformCode;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

public record PriceHistoryView(
        String hardwareKey,
        HistoryRange range,
        PlatformCode platform,
        List<DailyPoint> points,
        List<ChangePoint> changes,
        BigDecimal lowestPrice,
        BigDecimal highestPrice,
        BigDecimal changePercent,
        LocalDateTime updatedAt
) implements Serializable {

    public PriceHistoryView {
        points = List.copyOf(points);
        changes = List.copyOf(changes);
    }

    public enum HistoryRange {
        SEVEN_DAYS("7D", 7),
        THIRTY_DAYS("30D", 30),
        NINETY_DAYS("90D", 90);

        private final String apiValue;
        private final int days;

        HistoryRange(String apiValue, int days) {
            this.apiValue = apiValue;
            this.days = days;
        }

        @JsonValue
        public String apiValue() {
            return apiValue;
        }

        public int days() {
            return days;
        }

        public static HistoryRange from(String value) {
            String normalized = value.trim().toUpperCase(Locale.ROOT);
            for (HistoryRange range : values()) {
                if (range.apiValue.equals(normalized)) {
                    return range;
                }
            }
            throw new IllegalArgumentException("Unsupported history range: " + value);
        }
    }

    public record DailyPoint(
            LocalDate date,
            BigDecimal minimumPrice,
            int offerCount
    ) implements Serializable {
    }

    public record ChangePoint(
            Long offerId,
            String platform,
            BigDecimal salePrice,
            BigDecimal finalPrice,
            String stockStatus,
            String recordSource,
            LocalDateTime recordedAt
    ) implements Serializable {
    }
}
