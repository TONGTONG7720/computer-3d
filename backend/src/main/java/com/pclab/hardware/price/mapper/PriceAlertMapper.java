package com.pclab.hardware.price.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pclab.hardware.price.entity.PriceAlertEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface PriceAlertMapper extends BaseMapper<PriceAlertEntity> {

    @Insert("""
            INSERT INTO price_alert (
                public_id,
                owner_hash,
                hardware_id,
                target_price,
                current_best_price,
                status,
                triggered_at,
                checked_at,
                created_at,
                updated_at
            ) VALUES (
                #{alert.publicId},
                #{alert.ownerHash},
                #{alert.hardwareId},
                #{alert.targetPrice},
                #{alert.currentBestPrice},
                #{alert.status},
                #{alert.triggeredAt},
                #{alert.checkedAt},
                #{alert.createdAt},
                #{alert.updatedAt}
            )
            ON DUPLICATE KEY UPDATE
                target_price = VALUES(target_price),
                current_best_price = VALUES(current_best_price),
                status = VALUES(status),
                triggered_at = CASE
                    WHEN VALUES(status) = 'TRIGGERED'
                    THEN COALESCE(triggered_at, VALUES(triggered_at))
                    ELSE NULL
                END,
                checked_at = VALUES(checked_at),
                updated_at = VALUES(updated_at)
            """)
    @Options(useGeneratedKeys = true, keyProperty = "alert.id", keyColumn = "id")
    int upsertAlert(@Param("alert") PriceAlertEntity alert);

    @Select("""
            SELECT *
            FROM price_alert
            WHERE owner_hash = #{ownerHash}
              AND hardware_id = #{hardwareId}
            LIMIT 1
            """)
    PriceAlertEntity selectByOwnerHashAndHardwareId(
            @Param("ownerHash") String ownerHash,
            @Param("hardwareId") Long hardwareId
    );

    @Select("""
            SELECT *
            FROM price_alert
            WHERE owner_hash = #{ownerHash}
              AND status != 'PAUSED'
            ORDER BY updated_at DESC
            """)
    List<PriceAlertEntity> selectVisibleByOwnerHash(
            @Param("ownerHash") String ownerHash
    );

    @Update("""
            UPDATE price_alert
            SET status = 'PAUSED',
                updated_at = #{updatedAt}
            WHERE owner_hash = #{ownerHash}
              AND public_id = #{publicId}
              AND status != 'PAUSED'
            """)
    int pauseOwnedAlert(
            @Param("ownerHash") String ownerHash,
            @Param("publicId") String publicId,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    @Select("""
            SELECT *
            FROM price_alert
            WHERE status = 'ACTIVE'
            ORDER BY id ASC
            """)
    List<PriceAlertEntity> selectActiveAlerts();

    @Update("""
            UPDATE price_alert
            SET current_best_price = #{alert.currentBestPrice},
                status = #{alert.status},
                triggered_at = #{alert.triggeredAt},
                checked_at = #{alert.checkedAt},
                updated_at = #{alert.updatedAt}
            WHERE id = #{alert.id}
              AND status = 'ACTIVE'
              AND target_price = #{expectedTargetPrice}
            """)
    int updateIfStillActive(
            @Param("alert") PriceAlertEntity alert,
            @Param("expectedTargetPrice") BigDecimal expectedTargetPrice
    );
}
