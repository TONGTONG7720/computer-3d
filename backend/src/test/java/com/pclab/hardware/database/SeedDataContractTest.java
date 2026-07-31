package com.pclab.hardware.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class SeedDataContractTest {

    private static final Set<String> EXPECTED_TABLES = Set.of(
            "hardware_category",
            "users",
            "hardware",
            "cpu_spec",
            "gpu_spec",
            "motherboard_spec",
            "memory_spec",
            "storage_spec",
            "cooling_spec",
            "psu_spec",
            "case_spec",
            "hardware_model",
            "product_price",
            "build_config"
    );

    private static final Set<String> EXPECTED_HARDWARE_KEYS = Set.of(
            "cpu-intel-i9-14900k",
            "cpu-amd-7800x3d",
            "gpu-nvidia-rtx5090",
            "gpu-nvidia-rtx5080",
            "gpu-amd-rx8900xt",
            "gpu-nvidia-rtx5070",
            "motherboard-z790-lab",
            "motherboard-b650-lab",
            "motherboard-b760-d4-lab",
            "ram-ddr5-64gb",
            "ram-ddr5-32gb",
            "ram-ddr4-32gb",
            "storage-nvme-4tb",
            "storage-nvme-1tb",
            "cooling-tower-160",
            "cooling-aio-240",
            "cooling-aio-360",
            "psu-850w-gold",
            "psu-1000w-platinum",
            "psu-1200w-platinum",
            "case-future-glass",
            "case-compact-lab"
    );

    @Test
    void createsEveryHardwarePlatformTable() throws IOException {
        String migration = readResource("db/migration/V1__create_hardware_platform.sql");

        Set<String> actualTables = extractMatches(migration, "CREATE TABLE ([a-z_]+)");

        assertThat(actualTables).containsExactlyInAnyOrderElementsOf(EXPECTED_TABLES);
    }

    @Test
    void seedsStableBuilderHardwareKeys() throws IOException {
        String migration = readResource("db/migration/V2__seed_builder_hardware.sql");

        Set<String> actualKeys = extractMatches(migration, "'([a-z]+-[a-z0-9-]+)'\\s*,\\s*'[^']+'\\s*,\\s*'[^']+'\\s*,\\s*'(?:CPU|GPU|MOTHERBOARD|RAM|SSD|HDD|COOLING|PSU|CASE)'");

        assertThat(actualKeys).containsExactlyInAnyOrderElementsOf(EXPECTED_HARDWARE_KEYS);
    }

    private static Set<String> extractMatches(String input, String expression) {
        Matcher matcher = Pattern.compile(expression).matcher(input);
        java.util.HashSet<String> values = new java.util.HashSet<>();
        while (matcher.find()) {
            values.add(matcher.group(1));
        }
        return Set.copyOf(values);
    }

    private static String readResource(String path) throws IOException {
        try (InputStream stream = SeedDataContractTest.class.getClassLoader().getResourceAsStream(path)) {
            assertThat(stream).as("migration resource %s", path).isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
