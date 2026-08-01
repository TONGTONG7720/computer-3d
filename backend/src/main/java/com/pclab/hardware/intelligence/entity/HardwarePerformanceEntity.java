package com.pclab.hardware.intelligence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("hardware_performance_data")
public class HardwarePerformanceEntity {

    @TableId(value = "hardware_id", type = IdType.INPUT)
    private Long hardwareId;
    private Integer gamingScore;
    private Integer creatorScore;
    private Integer aiScore;
    private String source;
    private Integer profileVersion;
    private LocalDateTime measuredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
