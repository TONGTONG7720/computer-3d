package com.pclab.hardware.ai.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pclab.hardware.ai.config.AiProperties;
import com.pclab.hardware.ai.rag.AiExternalServiceException;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenAiEmbeddingClient implements AiEmbeddingGateway {

    private final AiProperties properties;
    private final RestClient client;

    public OpenAiEmbeddingClient(
            AiProperties properties,
            @Qualifier("aiModelRestClient") RestClient client
    ) {
        this.properties = properties;
        this.client = client;
    }

    @Override
    public List<Double> embed(String text) {
        if (!properties.getModel().isEnabled()) {
            throw new AiExternalServiceException("EMBEDDING_DISABLED");
        }
        try {
            EmbeddingResponse response = client.post()
                    .uri("/v1/embeddings")
                    .body(new EmbeddingRequest(properties.getModel().getEmbeddingName(), text))
                    .retrieve()
                    .body(EmbeddingResponse.class);
            if (response == null || response.data() == null || response.data().isEmpty()) {
                throw new AiExternalServiceException("EMBEDDING_RESPONSE_EMPTY");
            }
            List<Double> embedding = response.data().getFirst().embedding();
            if (embedding == null || embedding.isEmpty()) {
                throw new AiExternalServiceException("EMBEDDING_RESPONSE_EMPTY");
            }
            return List.copyOf(embedding);
        } catch (RestClientException exception) {
            throw new AiExternalServiceException("EMBEDDING_UNAVAILABLE", exception);
        }
    }

    private record EmbeddingRequest(String model, String input) {
    }

    private record EmbeddingResponse(List<EmbeddingData> data) {
    }

    private record EmbeddingData(
            @JsonProperty("embedding") List<Double> embedding
    ) {
    }
}
