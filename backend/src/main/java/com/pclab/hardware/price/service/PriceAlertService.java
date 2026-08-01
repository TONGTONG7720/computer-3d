package com.pclab.hardware.price.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PriceAlertService {

    private static final String ACTIVE = "ACTIVE";
    private static final String TRIGGERED = "TRIGGERED";
    private static final String PAUSED = "PAUSED";

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

    public PriceAlertView upsert(
            String ownerToken,
            String hardwareKey,
            BigDecimal targetPrice
    ) {
        String ownerHash = ownerHasher.hash(ownerToken);
        HardwareEntity hardware = hardwareService.requireHardware(hardwareKey);
        PriceComparisonView comparison = comparisonService.compareHardware(hardwareKey);
        PriceAlertEntity alert = alertMapper.selectOne(
                Wrappers.<PriceAlertEntity>lambdaQuery()
                        .eq(PriceAlertEntity::getOwnerHash, ownerHash)
                        .eq(PriceAlertEntity::getHardwareId, hardware.getId())
        );
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        boolean created = alert == null;
        if (created) {
            alert = new PriceAlertEntity();
            alert.setPublicId(UUID.randomUUID().toString());
            alert.setOwnerHash(ownerHash);
            alert.setHardwareId(hardware.getId());
            alert.setCreatedAt(now);
        }
        alert.setTargetPrice(targetPrice);
        applyPriceCheck(alert, comparison.lowestPrice(), now);
        alert.setUpdatedAt(now);
        if (created) {
            alertMapper.insert(alert);
        } else {
            alertMapper.updateById(alert);
        }
        return toView(alert, hardware);
    }

    @Transactional(readOnly = true)
    public List<PriceAlertView> list(String ownerToken) {
        String ownerHash = ownerHasher.hash(ownerToken);
        return alertMapper.selectList(
                        Wrappers.<PriceAlertEntity>lambdaQuery()
                                .eq(PriceAlertEntity::getOwnerHash, ownerHash)
                                .ne(PriceAlertEntity::getStatus, PAUSED)
                                .orderByDesc(PriceAlertEntity::getUpdatedAt)
                ).stream()
                .map(alert -> toView(
                        alert,
                        hardwareService.requireHardware(alert.getHardwareId().toString())
                ))
                .toList();
    }

    public void cancel(String ownerToken, String publicId) {
        String ownerHash = ownerHasher.hash(ownerToken);
        PriceAlertEntity alert = alertMapper.selectOne(
                Wrappers.<PriceAlertEntity>lambdaQuery()
                        .eq(PriceAlertEntity::getOwnerHash, ownerHash)
                        .eq(PriceAlertEntity::getPublicId, publicId)
                        .ne(PriceAlertEntity::getStatus, PAUSED)
        );
        if (alert == null) {
            throw new DomainException(ErrorCode.PRICE_ALERT_NOT_FOUND);
        }
        alert.setStatus(PAUSED);
        alert.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        alertMapper.updateById(alert);
    }

    public void reevaluateActiveAlerts() {
        List<PriceAlertEntity> activeAlerts = alertMapper.selectList(
                Wrappers.<PriceAlertEntity>lambdaQuery()
                        .eq(PriceAlertEntity::getStatus, ACTIVE)
        );
        for (PriceAlertEntity alert : activeAlerts) {
            HardwareEntity hardware = hardwareService.requireHardware(
                    alert.getHardwareId().toString()
            );
            PriceComparisonView comparison = comparisonService.compareHardware(
                    hardware.getHardwareKey()
            );
            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
            applyPriceCheck(alert, comparison.lowestPrice(), now);
            alert.setUpdatedAt(now);
            alertMapper.updateById(alert);
        }
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
