package com.pclab.hardware.ai.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class AiMigrationContractTest {

    private static final String MIGRATION = "db/migration/V5__create_ai_builder.sql";

    @Test
    void createsPromptKnowledgeRuleAndAuditTables() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains(
                "CREATE TABLE ai_prompt_config",
                "CREATE TABLE ai_knowledge_document",
                "CREATE TABLE ai_recommendation_rule",
                "CREATE TABLE ai_request_log"
        );
    }

    @Test
    void keepsRawUserMessagesOutOfAuditStorage() throws IOException {
        String sql = migrationSql();
        String auditTable = sql.substring(sql.indexOf("CREATE TABLE ai_request_log"));

        assertThat(auditTable).contains("input_hash", "knowledge_keys_json");
        assertThat(auditTable).doesNotContain("raw_message", "message_text", "prompt_text");
    }

    @Test
    void seedsActivePromptKnowledgeAndPurposeRules() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains(
                "INSERT INTO ai_prompt_config",
                "INSERT INTO ai_knowledge_document",
                "INSERT INTO ai_recommendation_rule",
                "INTENT_SYSTEM_V1",
                "GAMING_WEIGHTS",
                "AI_TRAINING_WEIGHTS"
        );
    }

    private static String migrationSql() throws IOException {
        try (InputStream stream = AiMigrationContractTest.class
                .getClassLoader()
                .getResourceAsStream(MIGRATION)) {
            assertThat(stream).as("migration resource %s", MIGRATION).isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
