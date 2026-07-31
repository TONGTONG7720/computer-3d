package com.pclab.hardware.price.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pclab.hardware.price.entity.PriceHistoryEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface PriceHistoryMapper extends BaseMapper<PriceHistoryEntity> {

    @Select("""
            <script>
            SELECT ph.*
            FROM price_history ph
            JOIN product p ON p.id = ph.product_id
            WHERE p.hardware_id = #{hardwareId}
              AND p.deleted = 0
              AND ph.recorded_at &gt;= #{start}
            <if test="platform != null">
              AND ph.platform = #{platform}
            </if>
            ORDER BY ph.recorded_at ASC
            </script>
            """)
    List<PriceHistoryEntity> selectByHardwareAndRange(
            @Param("hardwareId") Long hardwareId,
            @Param("start") LocalDateTime start,
            @Param("platform") String platform
    );
}
