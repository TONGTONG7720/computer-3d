package com.pclab.hardware.price.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class PriceMigrationContractTest {

    private static final String MIGRATION = "db/migration/V3__create_price_intelligence.sql";

    @Test
    void createsProductHistoryAndAnalyticsTables() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains(
                "CREATE TABLE product",
                "CREATE TABLE price_history",
                "CREATE TABLE price_click_event",
                "CREATE TABLE price_search_event",
                "CREATE TABLE product_match_audit",
                "ADD COLUMN product_id"
        );
    }

    @Test
    void backfillsLegacyPricesBeforeMakingProductRequired() throws IOException {
        String sql = migrationSql();

        assertThat(sql.indexOf("UPDATE product_price")).isGreaterThanOrEqualTo(0);
        assertThat(sql.indexOf("UPDATE product_price"))
                .isLessThan(sql.indexOf("MODIFY COLUMN product_id BIGINT UNSIGNED NOT NULL"));
    }

    @Test
    void preservesLegacyOfferValuesAndSeedsManualHistory() throws IOException {
        String sql = migrationSql();

        assertThat(sql).contains(
                "CHANGE COLUMN source platform",
                "CHANGE COLUMN price sale_price",
                "final_price = sale_price",
                "'MANUAL'",
                "INSERT INTO price_history"
        );
    }

    @Test
    void addsOptimisticVersionsForAdminPriceEditing() throws IOException {
        String sql = migrationSql("db/migration/V4__add_price_admin_versions.sql");

        assertThat(sql).contains(
                "ALTER TABLE product",
                "ADD COLUMN version",
                "ALTER TABLE product_price"
        );
    }

    private static String migrationSql() throws IOException {
        return migrationSql(MIGRATION);
    }

    private static String migrationSql(String resource) throws IOException {
        try (InputStream stream = PriceMigrationContractTest.class
                .getClassLoader()
                .getResourceAsStream(resource)) {
            assertThat(stream).as("migration resource %s", resource).isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
