package com.pclab.hardware.price.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("product_match_audit")
public class ProductMatchAuditEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long productId;
    private Long hardwareId;
    private BigDecimal confidence;
    private String decision;
    private String dimensionScoresJson;
    private String explanation;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}
