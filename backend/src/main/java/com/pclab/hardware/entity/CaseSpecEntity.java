package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("case_spec")
public class CaseSpecEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private Integer gpuMaxLengthMm;
    private String motherboardSizes;
    private Integer radiatorMaxSizeMm;
    private Integer coolerMaxHeightMm;
}
