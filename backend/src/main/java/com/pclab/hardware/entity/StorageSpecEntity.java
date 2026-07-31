package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("storage_spec")
public class StorageSpecEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private String storageType;
    private Integer capacityGb;
    private String interfaceType;
    private Integer readSpeedMbps;
    private Integer writeSpeedMbps;
}
