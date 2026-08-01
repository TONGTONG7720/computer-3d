package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("motherboard_spec")
public class MotherboardSpecEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private String socket;
    private String chipset;
    private String ramType;
    private String formFactor;
    private Integer memorySlots;
    private Integer maxMemoryGb;
    private String pcieVersion;
}
