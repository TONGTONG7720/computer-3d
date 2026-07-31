package com.pclab.hardware.ai.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.ai.config.AiProperties;
import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.ComponentTarget;
import com.pclab.hardware.ai.domain.AiRequirement.FormFactorPreference;
import com.pclab.hardware.ai.domain.AiRequirement.Priority;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.domain.AiRequirement.Style;
import com.pclab.hardware.ai.rag.AiExternalServiceException;
import com.pclab.hardware.ai.rag.AiKnowledgeEvidence;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenAiCompatibleIntentGateway implements AiIntentModelGateway {

    private final AiProperties properties;
    private final ObjectMapper strictMapper;
    private final RestClient client;

    public OpenAiCompatibleIntentGateway(
            AiProperties properties,
            ObjectMapper objectMapper,
            @Qualifier("aiModelRestClient") RestClient client
    ) {
        this.properties = properties;
        this.strictMapper = objectMapper.copy()
                .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        this.client = client;
    }

    @Override
    public AiModelResult parse(AiModelInput input) {
        try {
            ChatResponse response = client.post()
                    .uri("/v1/chat/completions")
                    .body(request(input))
                    .retrieve()
                    .body(ChatResponse.class);
            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                throw new AiExternalServiceException("MODEL_RESPONSE_EMPTY");
            }
            ChatMessage message = response.choices().getFirst().message();
            if (message == null || message.content() == null || message.content().isBlank()) {
                throw new AiExternalServiceException("MODEL_RESPONSE_EMPTY");
            }
            ModelRequirement payload = strictMapper.readValue(
                    message.content(),
                    ModelRequirement.class
            );
            validatePayload(payload);
            Usage usage = response.usage() == null ? new Usage(0, 0) : response.usage();
            return new AiModelResult(payload.toDomain(), usage.promptTokens(), usage.outputTokens());
        } catch (RestClientException exception) {
            throw new AiExternalServiceException("MODEL_UNAVAILABLE", exception);
        } catch (JsonProcessingException | IllegalArgumentException exception) {
            throw new AiExternalServiceException("MODEL_RESPONSE_INVALID", exception);
        }
    }

    private ChatRequest request(AiModelInput input) {
        return new ChatRequest(
                properties.getModel().getName(),
                List.of(
                        new ChatMessage("system", input.systemPrompt()),
                        new ChatMessage("user", userContent(input))
                ),
                properties.getModel().getTemperature(),
                properties.getModel().getMaxOutputTokens(),
                new ResponseFormat("json_object")
        );
    }

    private static String userContent(AiModelInput input) {
        String context = input.evidence().stream()
                .map(OpenAiCompatibleIntentGateway::formatEvidence)
                .collect(Collectors.joining("\n"));
        return "用户需求：\n" + input.message()
                + "\n\n<untrusted_knowledge>\n"
                + context
                + "\n</untrusted_knowledge>";
    }

    private static String formatEvidence(AiKnowledgeEvidence evidence) {
        return "[" + evidence.sourceKey() + "] " + evidence.excerpt();
    }

    private static void validatePayload(ModelRequirement payload) {
        if (payload.purposes() == null
                || payload.priorities() == null
                || payload.styles() == null
                || payload.formFactor() == null
                || payload.requestedChanges() == null
                || payload.missingInformation() == null) {
            throw new IllegalArgumentException("model requirement fields are incomplete");
        }
    }

    private record ChatRequest(
            String model,
            List<ChatMessage> messages,
            double temperature,
            @JsonProperty("max_tokens") int maxTokens,
            @JsonProperty("response_format") ResponseFormat responseFormat
    ) {
    }

    private record ChatMessage(String role, String content) {
    }

    private record ResponseFormat(String type) {
    }

    private record ChatResponse(List<Choice> choices, Usage usage) {
    }

    private record Choice(ChatMessage message) {
    }

    private record Usage(
            @JsonProperty("prompt_tokens") int promptTokens,
            @JsonProperty("completion_tokens") int outputTokens
    ) {
    }

    private record ModelRequirement(
            BigDecimal budget,
            Set<Purpose> purposes,
            Set<Priority> priorities,
            Set<Style> styles,
            FormFactorPreference formFactor,
            Map<ComponentTarget, String> requestedChanges,
            double confidence,
            List<String> missingInformation
    ) {

        AiRequirement toDomain() {
            return new AiRequirement(
                    budget,
                    purposes,
                    priorities,
                    styles,
                    formFactor,
                    requestedChanges,
                    confidence,
                    missingInformation
            );
        }
    }
}
