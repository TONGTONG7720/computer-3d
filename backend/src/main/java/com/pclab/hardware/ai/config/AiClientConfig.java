package com.pclab.hardware.ai.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AiClientConfig {

    @Bean
    @Qualifier("aiModelRestClient")
    RestClient aiModelRestClient(AiProperties properties) {
        return client(
                properties.getModel().getBaseUrl(),
                "Authorization",
                bearer(properties.getModel().getApiKey()),
                properties.getTimeoutMillis()
        );
    }

    @Bean
    @Qualifier("chromaRestClient")
    RestClient chromaRestClient(AiProperties properties) {
        return client(
                properties.getVector().getBaseUrl(),
                "x-chroma-token",
                properties.getVector().getToken(),
                properties.getTimeoutMillis()
        );
    }

    private static RestClient client(
            String baseUrl,
            String headerName,
            String headerValue,
            int timeoutMillis
    ) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        Duration timeout = Duration.ofMillis(timeoutMillis);
        factory.setReadTimeout(timeout);
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory);
        if (!headerValue.isBlank()) {
            builder.defaultHeader(headerName, headerValue);
        }
        return builder.build();
    }

    private static String bearer(String apiKey) {
        return apiKey.isBlank() ? "" : "Bearer " + apiKey;
    }
}
