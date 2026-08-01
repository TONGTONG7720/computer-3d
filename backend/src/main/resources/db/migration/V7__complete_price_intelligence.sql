ALTER TABLE product_price
    ADD COLUMN delivery_score DECIMAL(5,2) NOT NULL DEFAULT 70 AFTER seller_score,
    ADD COLUMN delivery_note VARCHAR(160) NOT NULL DEFAULT '' AFTER delivery_score;

ALTER TABLE product
    ADD COLUMN image_fingerprint VARCHAR(128) NULL AFTER image_url;

ALTER TABLE price_click_event
    ADD COLUMN event_id CHAR(36) NULL AFTER id,
    ADD COLUMN session_hash CHAR(64) NOT NULL DEFAULT '' AFTER session_id;

UPDATE price_click_event
SET event_id = UUID(),
    session_hash = SHA2(CONCAT('legacy:', session_id), 256)
WHERE event_id IS NULL;

ALTER TABLE price_click_event
    MODIFY COLUMN event_id CHAR(36) NOT NULL,
    ADD UNIQUE KEY uk_click_event_id (event_id),
    ADD KEY idx_click_session_hash_time (session_hash, clicked_at);

ALTER TABLE price_search_event
    ADD COLUMN event_id CHAR(36) NULL AFTER id,
    ADD COLUMN session_hash CHAR(64) NOT NULL DEFAULT '' AFTER session_id;

UPDATE price_search_event
SET event_id = UUID(),
    session_hash = SHA2(CONCAT('legacy:', session_id), 256)
WHERE event_id IS NULL;

ALTER TABLE price_search_event
    MODIFY COLUMN event_id CHAR(36) NOT NULL,
    ADD UNIQUE KEY uk_search_event_id (event_id),
    ADD KEY idx_search_session_hash_time (session_hash, searched_at);

CREATE TABLE price_alert (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    owner_hash CHAR(64) NOT NULL,
    hardware_id BIGINT UNSIGNED NOT NULL,
    target_price DECIMAL(12,2) NOT NULL,
    current_best_price DECIMAL(12,2) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    triggered_at DATETIME(3) NULL,
    checked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_price_alert_public_id (public_id),
    UNIQUE KEY uk_price_alert_owner_hardware (owner_hash, hardware_id),
    KEY idx_price_alert_hardware_status (hardware_id, status),
    CONSTRAINT fk_price_alert_hardware
        FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE,
    CONSTRAINT chk_price_alert_target_price CHECK (target_price >= 0),
    CONSTRAINT chk_price_alert_current_best_price CHECK (
        current_best_price IS NULL OR current_best_price >= 0
    ),
    CONSTRAINT chk_price_alert_status CHECK (status IN ('ACTIVE', 'TRIGGERED', 'PAUSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
