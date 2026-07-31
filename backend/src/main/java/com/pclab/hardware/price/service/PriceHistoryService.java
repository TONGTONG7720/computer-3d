package com.pclab.hardware.price.service;

import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.price.domain.PlatformCode;
import com.pclab.hardware.price.entity.PriceHistoryEntity;
import com.pclab.hardware.price.mapper.PriceHistoryMapper;
import com.pclab.hardware.price.vo.PriceHistoryView;
import com.pclab.hardware.price.vo.PriceHistoryView.DailyPoint;
import com.pclab.hardware.price.vo.PriceHistoryView.HistoryRange;
import com.pclab.hardware.service.HardwareQueryService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PriceHistoryService {

    private final HardwareQueryService hardwareService;
    private final PriceHistoryMapper historyMapper;

    public PriceHistoryService(
            HardwareQueryService hardwareService,
            PriceHistoryMapper historyMapper
    ) {
        this.hardwareService = hardwareService;
        this.historyMapper = historyMapper;
    }

    @Cacheable(
            cacheNames = "price-history",
            key = "#idOrKey + ':' + #range.apiValue() + ':' + (#platform == null ? 'ALL' : #platform.name())"
    )
    public PriceHistoryView history(
            String idOrKey,
            HistoryRange range,
        PlatformCode platform
    ) {
        HardwareEntity hardware = hardwareService.requireHardware(idOrKey);
        LocalDateTime start = LocalDate.now(ZoneOffset.UTC)
                .minusDays(range.days() - 1L)
                .atStartOfDay();
        List<PriceHistoryEntity> history = historyMapper.selectByHardwareAndRange(
                hardware.getId(),
                start,
                platform == null ? null : platform.name()
        );
        return aggregate(hardware.getHardwareKey(), range, platform, history);
    }

    private static PriceHistoryView aggregate(
            String hardwareKey,
            HistoryRange range,
            PlatformCode platform,
            List<PriceHistoryEntity> history
    ) {
        Map<LocalDate, List<PriceHistoryEntity>> byDay = new TreeMap<>();
        for (PriceHistoryEntity point : history) {
            byDay.computeIfAbsent(point.getRecordedAt().toLocalDate(), ignored -> new java.util.ArrayList<>())
                    .add(point);
        }
        List<DailyPoint> points = byDay.entrySet().stream()
                .map(entry -> new DailyPoint(
                        entry.getKey(),
                        entry.getValue().stream()
                                .map(PriceHistoryEntity::getFinalPrice)
                                .min(Comparator.naturalOrder())
                                .orElseThrow(),
                        entry.getValue().size()
                ))
                .toList();
        if (points.isEmpty()) {
            return empty(hardwareKey, range, platform);
        }
        BigDecimal lowest = points.stream().map(DailyPoint::minimumPrice)
                .min(Comparator.naturalOrder()).orElseThrow();
        BigDecimal highest = points.stream().map(DailyPoint::minimumPrice)
                .max(Comparator.naturalOrder()).orElseThrow();
        BigDecimal first = points.getFirst().minimumPrice();
        BigDecimal change = first.signum() == 0
                ? BigDecimal.ZERO
                : points.getLast().minimumPrice().subtract(first)
                        .divide(first, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(2, RoundingMode.HALF_UP);
        LocalDateTime updatedAt = history.stream()
                .map(PriceHistoryEntity::getRecordedAt)
                .max(Comparator.naturalOrder())
                .orElseThrow();
        return new PriceHistoryView(
                hardwareKey,
                range,
                platform,
                points,
                lowest,
                highest,
                change,
                updatedAt
        );
    }

    private static PriceHistoryView empty(
            String hardwareKey,
            HistoryRange range,
            PlatformCode platform
    ) {
        return new PriceHistoryView(
                hardwareKey,
                range,
                platform,
                List.of(),
                null,
                null,
                BigDecimal.ZERO,
                LocalDateTime.now(ZoneOffset.UTC)
        );
    }
}
