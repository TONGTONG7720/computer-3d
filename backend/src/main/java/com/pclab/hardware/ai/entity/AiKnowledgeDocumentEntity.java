package com.pclab.hardware.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("ai_knowledge_document")
public class AiKnowledgeDocumentEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String documentKey;
    private String title;
    private String category;
    private String content;
    private String tagsJson;
    private String sourceLabel;
    private String vectorStatus;

    @Version
    private Integer version;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
