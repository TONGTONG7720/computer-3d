package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("product_price")
public class ProductPriceEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long hardwareId;
    private String source;
    private String seller;
    private BigDecimal price;
    private String currency;
    private Integer inStock;
    private String productUrl;
    private LocalDateTime checkedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
