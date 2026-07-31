package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("build_config")
public class BuildConfigEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String publicId;
    private Long userId;
    private String name;
    private String componentsJson;
    private BigDecimal totalPrice;
    private Integer performanceScore;
    private Integer powerUsageWatt;
    private String compatibilityStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
