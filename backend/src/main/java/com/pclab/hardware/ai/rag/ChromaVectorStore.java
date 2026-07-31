package com.pclab.hardware.ai.rag;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pclab.hardware.ai.config.AiProperties;
import com.pclab.hardware.ai.model.AiEmbeddingGateway;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class ChromaVectorStore implements VectorKnowledgeStore {

    private static final List<String> QUERY_INCLUDE = List.of(
            "documents",
            "metadatas",
            "distances"
    );

    private final AiProperties properties;
    private final AiEmbeddingGateway embeddingGateway;
    private final RestClient client;

    public ChromaVectorStore(
            AiProperties properties,
            AiEmbeddingGateway embeddingGateway,
            @Qualifier("chromaRestClient") RestClient client
    ) {
        this.properties = properties;
        this.embeddingGateway = embeddingGateway;
        this.client = client;
    }

    @Override
    public boolean isAvailable() {
        return properties.getVector().isEnabled()
                && !properties.getVector().getCollectionId().isBlank();
    }

    @Override
    public List<AiKnowledgeEvidence> query(KnowledgeQuery query) {
        if (!isAvailable()) {
            return List.of();
        }
        try {
            QueryResponse response = client.post()
                    .uri(endpoint("query"))
                    .body(new QueryRequest(
                            List.of(embeddingGateway.embed(query.text())),
                            query.limit(),
                            QUERY_INCLUDE
                    ))
                    .retrieve()
                    .body(QueryResponse.class);
            return toEvidence(response);
        } catch (RestClientException exception) {
            throw new AiExternalServiceException("VECTOR_UNAVAILABLE", exception);
        }
    }

    @Override
    public void upsert(VectorKnowledgeDocument document) {
        if (!isAvailable()) {
            throw new AiExternalServiceException("VECTOR_DISABLED");
        }
        try {
            client.post()
                    .uri(endpoint("upsert"))
                    .body(new UpsertRequest(
                            List.of(document.sourceKey()),
                            List.of(embeddingGateway.embed(document.content())),
                            List.of(document.content()),
                            List.of(new Metadata(document.title(), document.revision()))
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException exception) {
            throw new AiExternalServiceException("VECTOR_UPSERT_FAILED", exception);
        }
    }

    private List<AiKnowledgeEvidence> toEvidence(QueryResponse response) {
        if (response == null || response.ids() == null || response.ids().isEmpty()) {
            return List.of();
        }
        List<String> ids = response.ids().getFirst();
        List<String> documents = firstOrEmpty(response.documents());
        List<Double> distances = firstOrEmpty(response.distances());
        List<Metadata> metadatas = firstOrEmpty(response.metadatas());
        List<AiKnowledgeEvidence> evidence = new ArrayList<>();
        for (int index = 0; index < ids.size(); index++) {
            String sourceKey = ids.get(index);
            String document = valueAt(documents, index, "");
            Double distance = valueAt(distances, index, 1.0);
            Metadata metadata = valueAt(metadatas, index, new Metadata(sourceKey, 1));
            evidence.add(new AiKnowledgeEvidence(
                    sourceKey,
                    metadata.title() == null ? sourceKey : metadata.title(),
                    document == null ? "" : document,
                    Math.max(0, Math.min(1, 1 - distance)),
                    metadata.revision() == null ? 1 : metadata.revision()
            ));
        }
        return List.copyOf(evidence);
    }

    private String endpoint(String action) {
        AiProperties.Vector vector = properties.getVector();
        return "/api/v2/tenants/%s/databases/%s/collections/%s/%s".formatted(
                vector.getTenant(),
                vector.getDatabase(),
                vector.getCollectionId(),
                action
        );
    }

    private static <T> List<T> firstOrEmpty(List<List<T>> values) {
        return values == null || values.isEmpty() ? List.of() : values.getFirst();
    }

    private static <T> T valueAt(List<T> values, int index, T fallback) {
        return index < values.size() && values.get(index) != null ? values.get(index) : fallback;
    }

    private record QueryRequest(
            @JsonProperty("query_embeddings") List<List<Double>> queryEmbeddings,
            @JsonProperty("n_results") int numberOfResults,
            List<String> include
    ) {
    }

    private record QueryResponse(
            List<List<String>> ids,
            List<List<Double>> distances,
            List<List<String>> documents,
            List<List<Metadata>> metadatas
    ) {
    }

    private record UpsertRequest(
            List<String> ids,
            List<List<Double>> embeddings,
            List<String> documents,
            List<Metadata> metadatas
    ) {
    }

    private record Metadata(String title, Integer revision) {
    }
}
