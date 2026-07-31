package com.pclab.hardware.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("ai_prompt_config")
public class AiPromptConfigEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String promptKey;
    private String name;
    private String content;
    private Integer version;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
