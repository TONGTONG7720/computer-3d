package com.pclab.hardware.price.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pclab.hardware.price.entity.PriceClickEventEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface PriceClickEventMapper extends BaseMapper<PriceClickEventEntity> {

    @Select("""
            SELECT h.hardware_key AS hardwareKey,
                   h.name AS hardwareName,
                   COUNT(*) AS clickCount
            FROM price_click_event event
            JOIN hardware h ON h.id = event.hardware_id
            WHERE event.clicked_at >= #{since}
            GROUP BY h.id, h.hardware_key, h.name
            ORDER BY clickCount DESC
            LIMIT #{limit}
            """)
    List<TopHardwareClickRow> selectTopHardware(
            @Param("since") LocalDateTime since,
            @Param("limit") int limit
    );
}
