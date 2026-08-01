package com.pclab.hardware.price.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class PriceIntelligenceV7MigrationContractTest {

    @Test
    void createsLogisticsPrivacyAndAnonymousAlertContracts() throws IOException {
        String sql = Files.readString(Path.of(
                "src/main/resources/db/migration/V7__complete_price_intelligence.sql"
        ));

        assertThat(sql).contains(
                "ADD COLUMN delivery_score DECIMAL(5,2)",
                "ADD COLUMN delivery_note VARCHAR(160)",
                "ADD COLUMN image_fingerprint VARCHAR(128)",
                "CREATE TABLE price_alert",
                "owner_hash CHAR(64)",
                "UNIQUE KEY uk_price_alert_owner_hardware"
        );
        assertThat(sql).doesNotContain("DROP TABLE product", "DROP TABLE product_price");
    }
}
