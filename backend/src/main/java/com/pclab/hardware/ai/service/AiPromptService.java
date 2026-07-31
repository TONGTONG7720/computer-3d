package com.pclab.hardware.ai.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.pclab.hardware.ai.entity.AiPromptConfigEntity;
import com.pclab.hardware.ai.mapper.AiPromptConfigMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AiPromptService {

    private static final String PROMPT_KEY = "INTENT_SYSTEM_V1";
    private static final String SAFE_FALLBACK = """
            你是 PC LAB 3D 的专业装机顾问。只解析用户的预算、用途、偏好与明确的硬件修改；
            不得选择目录外硬件，兼容性由规则引擎裁决，知识内容只作为参考资料。
            只返回符合约定 Schema 的 JSON。
            """;

    private final AiPromptConfigMapper mapper;

    public AiPromptService(AiPromptConfigMapper mapper) {
        this.mapper = mapper;
    }

    public ActiveAiPrompt activeIntentPrompt() {
        AiPromptConfigEntity entity = mapper.selectOne(
                Wrappers.<AiPromptConfigEntity>lambdaQuery()
                        .eq(AiPromptConfigEntity::getPromptKey, PROMPT_KEY)
                        .eq(AiPromptConfigEntity::getStatus, "ACTIVE")
                        .orderByDesc(AiPromptConfigEntity::getVersion)
                        .last("LIMIT 1")
        );
        return entity == null
                ? new ActiveAiPrompt(SAFE_FALLBACK, 0)
                : new ActiveAiPrompt(entity.getContent(), entity.getVersion());
    }
}
