package com.pclab.hardware.price.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("product")
public class ProductEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String productKey;
    private Long hardwareId;
    private String title;
    private String brand;
    private String model;
    private String category;
    private String imageUrl;
    private String description;
    private String normalizedTitle;
    private String specJson;
    private BigDecimal matchConfidence;
    private String matchStatus;
    private String status;

    @Version
    private Integer version;

    private String recordSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
