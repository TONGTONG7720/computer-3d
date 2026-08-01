package com.pclab.hardware.price.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("price_alert")
public class PriceAlertEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String publicId;
    private String ownerHash;
    private Long hardwareId;
    private BigDecimal targetPrice;
    private BigDecimal currentBestPrice;
    private String status;
    private LocalDateTime triggeredAt;
    private LocalDateTime checkedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
