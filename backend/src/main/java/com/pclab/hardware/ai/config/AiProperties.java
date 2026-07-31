package com.pclab.hardware.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    private int timeoutMillis = 6000;
    private String analyticsHashKey = "pc-lab-ai-local-development-key";
    private final Model model = new Model();
    private final Vector vector = new Vector();

    public int getTimeoutMillis() {
        return timeoutMillis;
    }

    public void setTimeoutMillis(int timeoutMillis) {
        this.timeoutMillis = timeoutMillis;
    }

    public String getAnalyticsHashKey() {
        return analyticsHashKey;
    }

    public void setAnalyticsHashKey(String analyticsHashKey) {
        this.analyticsHashKey = analyticsHashKey;
    }

    public Model getModel() {
        return model;
    }

    public Vector getVector() {
        return vector;
    }

    public static class Model {

        private boolean enabled;
        private String baseUrl = "https://api.openai.com";
        private String apiKey = "";
        private String name = "";
        private String embeddingName = "text-embedding-3-small";
        private int maxOutputTokens = 800;
        private double temperature = 0.1;
        private int estimatedTokensPerRequest = 1200;
        private int dailyTokenBudget = 50000;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmbeddingName() {
            return embeddingName;
        }

        public void setEmbeddingName(String embeddingName) {
            this.embeddingName = embeddingName;
        }

        public int getMaxOutputTokens() {
            return maxOutputTokens;
        }

        public void setMaxOutputTokens(int maxOutputTokens) {
            this.maxOutputTokens = maxOutputTokens;
        }

        public double getTemperature() {
            return temperature;
        }

        public void setTemperature(double temperature) {
            this.temperature = temperature;
        }

        public int getEstimatedTokensPerRequest() {
            return estimatedTokensPerRequest;
        }

        public void setEstimatedTokensPerRequest(int estimatedTokensPerRequest) {
            this.estimatedTokensPerRequest = estimatedTokensPerRequest;
        }

        public int getDailyTokenBudget() {
            return dailyTokenBudget;
        }

        public void setDailyTokenBudget(int dailyTokenBudget) {
            this.dailyTokenBudget = dailyTokenBudget;
        }
    }

    public static class Vector {

        private boolean enabled;
        private String baseUrl = "http://127.0.0.1:8000";
        private String token = "";
        private String tenant = "default_tenant";
        private String database = "default_database";
        private String collectionId = "";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getTenant() {
            return tenant;
        }

        public void setTenant(String tenant) {
            this.tenant = tenant;
        }

        public String getDatabase() {
            return database;
        }

        public void setDatabase(String database) {
            this.database = database;
        }

        public String getCollectionId() {
            return collectionId;
        }

        public void setCollectionId(String collectionId) {
            this.collectionId = collectionId;
        }
    }
}
