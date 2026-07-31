package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.domain.AiRoute;
import com.pclab.hardware.ai.dto.AiBuildRequest;
import com.pclab.hardware.ai.recommendation.AiRecommendationUnavailableException;
import com.pclab.hardware.ai.vo.AiBuildView;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AiBuilderService {

    private final AiIntentService intentService;
    private final AiConfigurationService configurationService;
    private final AiBuildViewAssembler viewAssembler;
    private final AiAuditService auditService;

    public AiBuilderService(
            AiIntentService intentService,
            AiConfigurationService configurationService,
            AiBuildViewAssembler viewAssembler,
            AiAuditService auditService
    ) {
        this.intentService = intentService;
        this.configurationService = configurationService;
        this.viewAssembler = viewAssembler;
        this.auditService = auditService;
    }

    public AiBuildView build(AiBuildRequest request) {
        long startedAt = System.nanoTime();
        String requestId = UUID.randomUUID().toString();
        String sessionId = request.sessionId() == null
                ? UUID.randomUUID().toString()
                : request.sessionId();
        AiResolvedIntent intent = null;
        try {
            intent = intentService.resolve(request.message());
            AiConfigurationResult configuration = configurationService.generate(
                    intent.requirement(),
                    request.currentComponents()
            );
            AiBuildView view = viewAssembler.toView(
                    requestId,
                    sessionId,
                    intent,
                    configuration
            );
            auditService.record(auditRecord(
                    request,
                    requestId,
                    sessionId,
                    intent,
                    configuration.build().publicId(),
                    elapsedMillis(startedAt),
                    intent.route() == AiRoute.LLM_FALLBACK ? "FALLBACK" : "SUCCESS",
                    ""
            ));
            return view;
        } catch (AiRecommendationUnavailableException exception) {
            auditFailure(request, requestId, sessionId, intent, startedAt, "NO_COMPATIBLE_BUILD");
            throw new DomainException(
                    ErrorCode.AI_RECOMMENDATION_UNAVAILABLE,
                    "没有找到同时满足兼容性与指定硬件的方案"
            );
        } catch (DomainException exception) {
            auditFailure(request, requestId, sessionId, intent, startedAt, exception.errorCode().name());
            throw exception;
        }
    }

    private void auditFailure(
            AiBuildRequest request,
            String requestId,
            String sessionId,
            AiResolvedIntent intent,
            long startedAt,
            String failureCode
    ) {
        auditService.record(auditRecord(
                request,
                requestId,
                sessionId,
                intent,
                null,
                elapsedMillis(startedAt),
                "REJECTED",
                failureCode
        ));
    }

    private static AiAuditRecord auditRecord(
            AiBuildRequest request,
            String requestId,
            String sessionId,
            AiResolvedIntent intent,
            String configId,
            long latencyMillis,
            String outcome,
            String failureCode
    ) {
        return new AiAuditRecord(
                requestId,
                sessionId,
                request.message(),
                intent == null ? AiRoute.RULE : intent.route(),
                intent == null ? null : intent.requirement(),
                intent == null ? 0 : intent.promptVersion(),
                intent == null ? List.of() : intent.evidence().stream()
                        .map(evidence -> evidence.sourceKey())
                        .toList(),
                configId,
                latencyMillis,
                intent == null ? 0 : intent.inputTokens(),
                intent == null ? 0 : intent.outputTokens(),
                outcome,
                failureCode
        );
    }

    private static long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
