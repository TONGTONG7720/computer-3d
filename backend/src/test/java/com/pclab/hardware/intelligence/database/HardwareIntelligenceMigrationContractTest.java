package com.pclab.hardware.intelligence.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class HardwareIntelligenceMigrationContractTest {

    private static final String MIGRATION =
            "db/migration/V6__create_hardware_intelligence.sql";

    @Test
    void extendsSpecificationsWithoutReplacingExistingHardwareTables() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains(
                "ALTER TABLE hardware",
                "ADD COLUMN popularity_score",
                "ALTER TABLE cpu_spec",
                "ADD COLUMN generation",
                "ALTER TABLE gpu_spec",
                "ADD COLUMN interface_type",
                "ADD COLUMN resolution_support",
                "ALTER TABLE motherboard_spec",
                "ADD COLUMN chipset",
                "ALTER TABLE psu_spec",
                "ADD COLUMN connectors",
                "ALTER TABLE hardware_model",
                "ADD COLUMN animation_config"
        );
        assertThat(sql).doesNotContain("CREATE TABLE hardware (");
    }

    @Test
    void createsVersionedPerformanceAndCompatibilityIntelligence() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains(
                "CREATE TABLE hardware_performance_data",
                "gaming_score",
                "creator_score",
                "ai_score",
                "profile_version",
                "CREATE TABLE compatibility_rule",
                "UNIQUE KEY uk_compatibility_rule_code",
                "KEY idx_compatibility_rule_runtime",
                "CHECK (gaming_score BETWEEN 0 AND 100)",
                "CHECK (severity IN ('ERROR', 'WARNING'))"
        );
    }

    @Test
    void seedsReviewedProfilesAndEveryRuntimeRule() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains(
                "cpu-intel-i9-14900k",
                "cpu-amd-7800x3d",
                "gpu-nvidia-rtx5090",
                "gpu-nvidia-rtx5080",
                "gpu-amd-rx8900xt",
                "ram-ddr5-32gb",
                "ram-ddr5-64gb",
                "case-future-glass",
                "SOCKET_MATCH",
                "MEMORY_GENERATION",
                "GPU_CLEARANCE",
                "CPU_COOLING_TDP",
                "COOLER_SOCKET",
                "MOTHERBOARD_FORM_FACTOR",
                "RADIATOR_CLEARANCE",
                "PSU_HEADROOM"
        );
    }

    private static String migrationSql() throws IOException {
        try (InputStream stream = HardwareIntelligenceMigrationContractTest.class
                .getClassLoader()
                .getResourceAsStream(MIGRATION)) {
            assertThat(stream).as("migration resource %s", MIGRATION).isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
