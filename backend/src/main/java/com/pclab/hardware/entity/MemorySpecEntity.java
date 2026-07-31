package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("memory_spec")
public class MemorySpecEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private Integer capacityGb;
    private String generation;
    private Integer frequencyMhz;
    private Integer moduleCount;
    private String latency;
}
