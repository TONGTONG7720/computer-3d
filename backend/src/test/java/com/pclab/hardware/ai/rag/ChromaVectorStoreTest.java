package com.pclab.hardware.ai.rag;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.pclab.hardware.ai.config.AiProperties;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class ChromaVectorStoreTest {

    @Test
    void returnsRankedEvidenceFromChromaV2Query() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AiProperties properties = properties();
        ChromaVectorStore store = new ChromaVectorStore(
                properties,
                text -> List.of(0.1, 0.2, 0.3),
                builder.baseUrl(properties.getVector().getBaseUrl()).build()
        );
        server.expect(requestTo(
                        "https://chroma.test/api/v2/tenants/default_tenant/databases/pc_lab/"
                                + "collections/collection-1/query"
                ))
                .andExpect(method(POST))
                .andRespond(withSuccess(responseJson(), MediaType.APPLICATION_JSON));

        List<AiKnowledgeEvidence> result = store.query(new KnowledgeQuery("gaming gpu", 3));

        assertThat(result).singleElement().satisfies(evidence -> {
            assertThat(evidence.sourceKey()).isEqualTo("WORKLOAD_GAMING_V1");
            assertThat(evidence.score()).isEqualTo(0.92);
        });
        server.verify();
    }

    private static AiProperties properties() {
        AiProperties properties = new AiProperties();
        properties.getVector().setEnabled(true);
        properties.getVector().setBaseUrl("https://chroma.test");
        properties.getVector().setTenant("default_tenant");
        properties.getVector().setDatabase("pc_lab");
        properties.getVector().setCollectionId("collection-1");
        return properties;
    }

    private static String responseJson() {
        return """
                {
                  "ids": [["WORKLOAD_GAMING_V1"]],
                  "include": ["documents", "metadatas", "distances"],
                  "distances": [[0.08]],
                  "documents": [["3A 游戏配置优先显卡"]],
                  "metadatas": [[{"title":"游戏装机预算分配","revision":1}]],
                  "embeddings": null,
                  "uris": null
                }
                """;
    }
}
