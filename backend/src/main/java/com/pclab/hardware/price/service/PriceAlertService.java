package com.pclab.hardware.price.service;

import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.entity.PriceAlertEntity;
import com.pclab.hardware.price.mapper.PriceAlertMapper;
import com.pclab.hardware.price.vo.PriceAlertView;
import com.pclab.hardware.price.vo.PriceComparisonView;
import com.pclab.hardware.service.HardwareQueryService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PriceAlertService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PriceAlertService.class);
    private static final String ALERT_CACHE = "price-alerts";
    private static final String HASHED_OWNER_KEY =
            "@priceAlertOwnerHasher.hash(#ownerToken)";
    private static final String ACTIVE = "ACTIVE";
    private static final String TRIGGERED = "TRIGGERED";

    private final HardwareQueryService hardwareService;
    private final PriceAlertMapper alertMapper;
    private final PriceComparisonService comparisonService;
    private final PriceAlertOwnerHasher ownerHasher;

    public PriceAlertService(
            HardwareQueryService hardwareService,
            PriceAlertMapper alertMapper,
            PriceComparisonService comparisonService,
            PriceAlertOwnerHasher ownerHasher
    ) {
        this.hardwareService = hardwareService;
        this.alertMapper = alertMapper;
        this.comparisonService = comparisonService;
        this.ownerHasher = ownerHasher;
    }

    @Transactional
    @CacheEvict(cacheNames = ALERT_CACHE, key = HASHED_OWNER_KEY)
    public PriceAlertView upsert(
            String ownerToken,
            String hardwareKey,
            BigDecimal targetPrice
    ) {
        String ownerHash = ownerHasher.hash(ownerToken);
        HardwareEntity hardware = hardwareService.requireHardware(hardwareKey);
        PriceComparisonView comparison = comparisonService.compareHardware(hardwareKey);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        PriceAlertEntity candidate = new PriceAlertEntity();
        candidate.setPublicId(UUID.randomUUID().toString());
        candidate.setOwnerHash(ownerHash);
        candidate.setHardwareId(hardware.getId());
        candidate.setTargetPrice(targetPrice);
        candidate.setCreatedAt(now);
        applyPriceCheck(candidate, comparison.lowestPrice(), now);
        candidate.setUpdatedAt(now);
        alertMapper.upsertAlert(candidate);
        PriceAlertEntity persisted = alertMapper.selectByOwnerHashAndHardwareId(
                ownerHash,
                hardware.getId()
        );
        if (persisted == null) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR);
        }
        return toView(persisted, hardware);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = ALERT_CACHE, key = HASHED_OWNER_KEY)
    public List<PriceAlertView> list(String ownerToken) {
        String ownerHash = ownerHasher.hash(ownerToken);
        return alertMapper.selectVisibleByOwnerHash(ownerHash).stream()
                .map(alert -> toView(
                        alert,
                        hardwareService.requireHardware(alert.getHardwareId().toString())
                ))
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = ALERT_CACHE, key = HASHED_OWNER_KEY)
    public void cancel(String ownerToken, String publicId) {
        String ownerHash = ownerHasher.hash(ownerToken);
        int updated = alertMapper.pauseOwnedAlert(
                ownerHash,
                publicId,
                LocalDateTime.now(ZoneOffset.UTC)
        );
        if (updated == 0) {
            throw new DomainException(ErrorCode.PRICE_ALERT_NOT_FOUND);
        }
    }

    @CacheEvict(
            cacheNames = ALERT_CACHE,
            allEntries = true,
            condition = "#result > 0"
    )
    public int reevaluateActiveAlerts() {
        int updatedCount = 0;
        for (PriceAlertEntity alert : alertMapper.selectActiveAlerts()) {
            try {
                BigDecimal expectedTargetPrice = alert.getTargetPrice();
                HardwareEntity hardware = hardwareService.requireHardware(
                        alert.getHardwareId().toString()
                );
                PriceComparisonView comparison = comparisonService.compareHardware(
                        hardware.getHardwareKey()
                );
                LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
                applyPriceCheck(alert, comparison.lowestPrice(), now);
                alert.setUpdatedAt(now);
                updatedCount += alertMapper.updateIfStillActive(
                        alert,
                        expectedTargetPrice
                );
            } catch (RuntimeException exception) {
                LOGGER.warn(
                        "price.alert.reevaluation.failed alertId={} hardwareId={} error={}",
                        alert.getId(),
                        alert.getHardwareId(),
                        exception.getClass().getSimpleName()
                );
            }
        }
        return updatedCount;
    }

    private static void applyPriceCheck(
            PriceAlertEntity alert,
            BigDecimal currentBestPrice,
            LocalDateTime checkedAt
    ) {
        alert.setCurrentBestPrice(currentBestPrice);
        alert.setCheckedAt(checkedAt);
        boolean triggered = currentBestPrice != null
                && currentBestPrice.compareTo(alert.getTargetPrice()) <= 0;
        if (triggered) {
            alert.setStatus(TRIGGERED);
            if (alert.getTriggeredAt() == null) {
                alert.setTriggeredAt(checkedAt);
            }
            return;
        }
        alert.setStatus(ACTIVE);
        alert.setTriggeredAt(null);
    }

    private static PriceAlertView toView(
            PriceAlertEntity alert,
            HardwareEntity hardware
    ) {
        return new PriceAlertView(
                alert.getPublicId(),
                hardware.getHardwareKey(),
                hardware.getName(),
                alert.getTargetPrice(),
                alert.getCurrentBestPrice(),
                alert.getStatus(),
                alert.getTriggeredAt(),
                alert.getCheckedAt(),
                alert.getUpdatedAt()
        );
    }
}
