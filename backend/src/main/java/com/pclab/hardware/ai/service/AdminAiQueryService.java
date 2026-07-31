package com.pclab.hardware.ai.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pclab.hardware.ai.entity.AiKnowledgeDocumentEntity;
import com.pclab.hardware.ai.entity.AiPromptConfigEntity;
import com.pclab.hardware.ai.entity.AiRecommendationRuleEntity;
import com.pclab.hardware.ai.entity.AiRequestLogEntity;
import com.pclab.hardware.ai.mapper.AiKnowledgeDocumentMapper;
import com.pclab.hardware.ai.mapper.AiPromptConfigMapper;
import com.pclab.hardware.ai.mapper.AiRecommendationRuleMapper;
import com.pclab.hardware.ai.mapper.AiRequestLogMapper;
import com.pclab.hardware.ai.vo.AdminAiViews.AiDashboardView;
import com.pclab.hardware.ai.vo.AdminAiViews.KnowledgeView;
import com.pclab.hardware.ai.vo.AdminAiViews.PromptView;
import com.pclab.hardware.ai.vo.AdminAiViews.RequestLogView;
import com.pclab.hardware.ai.vo.AdminAiViews.RuleView;
import com.pclab.hardware.vo.PageView;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminAiQueryService {

    private final AiPromptConfigMapper promptMapper;
    private final AiKnowledgeDocumentMapper knowledgeMapper;
    private final AiRecommendationRuleMapper ruleMapper;
    private final AiRequestLogMapper logMapper;
    private final AdminAiViewAssembler assembler;

    public AdminAiQueryService(
            AiPromptConfigMapper promptMapper,
            AiKnowledgeDocumentMapper knowledgeMapper,
            AiRecommendationRuleMapper ruleMapper,
            AiRequestLogMapper logMapper,
            AdminAiViewAssembler assembler
    ) {
        this.promptMapper = promptMapper;
        this.knowledgeMapper = knowledgeMapper;
        this.ruleMapper = ruleMapper;
        this.logMapper = logMapper;
        this.assembler = assembler;
    }

    public AiDashboardView dashboard() {
        LocalDateTime since = LocalDateTime.now(ZoneOffset.UTC).minusHours(24);
        List<AiRequestLogEntity> logs = logMapper.selectList(
                Wrappers.<AiRequestLogEntity>lambdaQuery()
                        .ge(AiRequestLogEntity::getCreatedAt, since)
        );
        long fallback = logs.stream()
                .filter(log -> "LLM_FALLBACK".equals(log.getRoute()))
                .count();
        long failed = logs.stream()
                .filter(log -> "FAILED".equals(log.getOutcome())
                        || "REJECTED".equals(log.getOutcome()))
                .count();
        int averageLatency = logs.isEmpty() ? 0 : (int) Math.round(logs.stream()
                .mapToInt(AiRequestLogEntity::getLatencyMs)
                .average().orElse(0));
        long tokens = logs.stream()
                .mapToLong(log -> log.getInputTokens() + log.getOutputTokens())
                .sum();
        return new AiDashboardView(
                activePrompts(),
                activeKnowledge(),
                activeRules(),
                logs.size(),
                failed,
                averageLatency,
                tokens,
                logs.isEmpty() ? 0 : fallback / (double) logs.size(),
                LocalDateTime.now(ZoneOffset.UTC)
        );
    }

    public List<PromptView> prompts() {
        return promptMapper.selectList(
                        Wrappers.<AiPromptConfigEntity>lambdaQuery()
                                .orderByAsc(AiPromptConfigEntity::getPromptKey)
                                .orderByDesc(AiPromptConfigEntity::getVersion)
                ).stream().map(assembler::prompt).toList();
    }

    public List<KnowledgeView> knowledge() {
        return knowledgeMapper.selectList(
                        Wrappers.<AiKnowledgeDocumentEntity>lambdaQuery()
                                .ne(AiKnowledgeDocumentEntity::getStatus, "ARCHIVED")
                                .orderByAsc(AiKnowledgeDocumentEntity::getCategory)
                                .orderByAsc(AiKnowledgeDocumentEntity::getDocumentKey)
                ).stream().map(assembler::knowledge).toList();
    }

    public List<RuleView> rules() {
        return ruleMapper.selectList(
                        Wrappers.<AiRecommendationRuleEntity>lambdaQuery()
                                .orderByAsc(AiRecommendationRuleEntity::getPriority)
                ).stream().map(assembler::rule).toList();
    }

    public PageView<RequestLogView> logs(int page, int size, String outcome, String route) {
        var query = Wrappers.<AiRequestLogEntity>lambdaQuery()
                .eq(outcome != null, AiRequestLogEntity::getOutcome, outcome)
                .eq(route != null, AiRequestLogEntity::getRoute, route)
                .orderByDesc(AiRequestLogEntity::getCreatedAt);
        Page<AiRequestLogEntity> result = logMapper.selectPage(Page.of(page, size), query);
        return new PageView<>(
                result.getCurrent(),
                result.getSize(),
                result.getTotal(),
                result.getPages(),
                result.getRecords().stream().map(assembler::log).toList()
        );
    }

    private long activePrompts() {
        return promptMapper.selectCount(Wrappers.<AiPromptConfigEntity>lambdaQuery()
                .eq(AiPromptConfigEntity::getStatus, "ACTIVE"));
    }

    private long activeKnowledge() {
        return knowledgeMapper.selectCount(Wrappers.<AiKnowledgeDocumentEntity>lambdaQuery()
                .eq(AiKnowledgeDocumentEntity::getStatus, "ACTIVE"));
    }

    private long activeRules() {
        return ruleMapper.selectCount(Wrappers.<AiRecommendationRuleEntity>lambdaQuery()
                .eq(AiRecommendationRuleEntity::getStatus, "ACTIVE"));
    }
}
