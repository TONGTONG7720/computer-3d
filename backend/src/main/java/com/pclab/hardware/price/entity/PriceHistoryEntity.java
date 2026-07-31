package com.pclab.hardware.price.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("price_history")
public class PriceHistoryEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long productId;
    private Long offerId;
    private String platform;
    private BigDecimal salePrice;
    private BigDecimal finalPrice;
    private String currency;
    private String stockStatus;
    private String recordSource;
    private LocalDateTime recordedAt;
    private LocalDateTime createdAt;
}
