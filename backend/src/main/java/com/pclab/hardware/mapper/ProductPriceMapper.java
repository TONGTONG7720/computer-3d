package com.pclab.hardware.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pclab.hardware.entity.ProductPriceEntity;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface ProductPriceMapper extends BaseMapper<ProductPriceEntity> {

    @Select("""
            SELECT pp.*
            FROM product_price pp
            JOIN product p ON p.id = pp.product_id
            WHERE p.hardware_id = #{hardwareId}
              AND p.deleted = 0
              AND pp.is_enabled = 1
            ORDER BY pp.final_price ASC
            """)
    List<ProductPriceEntity> selectByHardwareId(@Param("hardwareId") Long hardwareId);
}
