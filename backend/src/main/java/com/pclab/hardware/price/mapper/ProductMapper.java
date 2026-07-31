package com.pclab.hardware.price.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pclab.hardware.price.entity.ProductEntity;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface ProductMapper extends BaseMapper<ProductEntity> {

    @Select("""
            SELECT *
            FROM product
            WHERE hardware_id = #{hardwareId}
              AND status = 'ACTIVE'
              AND deleted = 0
            ORDER BY match_confidence DESC, id ASC
            """)
    List<ProductEntity> selectActiveByHardwareId(@Param("hardwareId") Long hardwareId);

    @Select("""
            SELECT COUNT(DISTINCT hardware_id)
            FROM product
            WHERE hardware_id IS NOT NULL
              AND status = 'ACTIVE'
              AND match_status = 'CONFIRMED'
              AND deleted = 0
            """)
    long countCoveredHardware();
}
