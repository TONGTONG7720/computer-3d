package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("hardware_model")
public class HardwareModelEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long hardwareId;
    private String name;
    private String glbUrl;
    private String textureUrl;
    private String previewUrl;
    private BigDecimal scaleX;
    private BigDecimal scaleY;
    private BigDecimal scaleZ;
    private BigDecimal positionX;
    private BigDecimal positionY;
    private BigDecimal positionZ;
    private BigDecimal rotationX;
    private BigDecimal rotationY;
    private BigDecimal rotationZ;
    private String animationConfig;
    private Integer lodLevel;
    private Long fileSizeBytes;
    private String checksumSha256;
    private Integer isPrimary;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
