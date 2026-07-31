package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("hardware")
public class HardwareEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String hardwareKey;
    private String name;
    private String brand;
    private String categoryCode;
    private String description;
    private BigDecimal basePrice;
    private Integer performanceScore;
    private Integer powerWatt;
    private String modelUrl;
    private String modelVariant;
    private String coverUrl;
    private String searchKey;
    private Integer sortOrder;
    private String status;

    @Version
    private Integer version;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
