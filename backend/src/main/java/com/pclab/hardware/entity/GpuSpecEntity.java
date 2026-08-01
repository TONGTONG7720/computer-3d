package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("gpu_spec")
public class GpuSpecEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private String chipset;
    private Integer vramGb;
    private String vramType;
    private String interfaceType;
    private String resolutionSupport;
    private Integer lengthMm;
    private Integer tdpWatt;
}
