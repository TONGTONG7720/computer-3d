package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import lombok.Data;

@Data
@TableName("cpu_spec")
public class CpuSpecEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private String socket;
    private Integer cores;
    private Integer threads;
    private BigDecimal baseClockGhz;
    private BigDecimal boostClockGhz;
    private Integer tdpWatt;
}
