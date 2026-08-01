package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("psu_spec")
public class PsuSpecEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private Integer wattage;
    private String certification;
    private String modularType;
    private String connectors;
}
