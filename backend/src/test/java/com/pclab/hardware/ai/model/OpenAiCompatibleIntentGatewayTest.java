package com.pclab.hardware.ai.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.ai.config.AiProperties;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.rag.AiKnowledgeEvidence;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class OpenAiCompatibleIntentGatewayTest {

    @Test
    void parsesStrictStructuredIntentFromCompatibleChatEndpoint() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AiProperties properties = properties();
        OpenAiCompatibleIntentGateway gateway = new OpenAiCompatibleIntentGateway(
                properties,
                new ObjectMapper(),
                builder.baseUrl(properties.getModel().getBaseUrl()).build()
        );
        server.expect(requestTo("https://model.test/v1/chat/completions"))
                .andExpect(method(POST))
                .andRespond(withSuccess(responseJson(), MediaType.APPLICATION_JSON));

        AiModelResult result = gateway.parse(new AiModelInput(
                "预算八千，玩游戏",
                "只返回 JSON",
                3,
                List.of(new AiKnowledgeEvidence(
                        "WORKLOAD_GAMING_V1",
                        "游戏预算",
                        "优先显卡",
                        0.96,
                        1
                ))
        ));

        assertThat(result.requirement().budget()).isEqualByComparingTo("8000");
        assertThat(result.requirement().purposes()).containsExactly(Purpose.GAMING);
        assertThat(result.inputTokens()).isEqualTo(120);
        assertThat(result.outputTokens()).isEqualTo(80);
        server.verify();
    }

    private static AiProperties properties() {
        AiProperties properties = new AiProperties();
        properties.getModel().setEnabled(true);
        properties.getModel().setBaseUrl("https://model.test");
        properties.getModel().setApiKey("test-key");
        properties.getModel().setName("test-model");
        return properties;
    }

    private static String responseJson() {
        return """
                {
                  "choices": [{
                    "message": {
                      "content": "{\\\"budget\\\":8000,\\\"purposes\\\":[\\\"GAMING\\\"],\\\"priorities\\\":[\\\"GPU\\\"],\\\"styles\\\":[],\\\"formFactor\\\":\\\"ANY\\\",\\\"requestedChanges\\\":{},\\\"confidence\\\":0.96,\\\"missingInformation\\\":[]}"
                    }
                  }],
                  "usage": {"prompt_tokens":120,"completion_tokens":80}
                }
                """;
    }
}
