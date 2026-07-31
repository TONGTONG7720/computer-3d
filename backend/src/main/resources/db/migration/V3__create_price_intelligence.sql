CREATE TABLE product (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_key VARCHAR(160) NOT NULL,
    hardware_id BIGINT UNSIGNED NULL,
    title VARCHAR(500) NOT NULL,
    brand VARCHAR(80) NOT NULL DEFAULT '',
    model VARCHAR(160) NOT NULL DEFAULT '',
    category VARCHAR(32) NOT NULL,
    image_url VARCHAR(500) NOT NULL DEFAULT '',
    description TEXT NULL,
    normalized_title VARCHAR(500) NOT NULL DEFAULT '',
    spec_json JSON NULL,
    match_confidence DECIMAL(5,4) NOT NULL DEFAULT 0,
    match_status VARCHAR(24) NOT NULL DEFAULT 'UNMATCHED',
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    record_source VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_key (product_key),
    KEY idx_product_hardware (hardware_id, status, deleted),
    KEY idx_product_match (match_status, match_confidence),
    KEY idx_product_category_brand (category, brand),
    CONSTRAINT fk_product_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE SET NULL,
    CONSTRAINT chk_product_match_confidence CHECK (match_confidence >= 0 AND match_confidence <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE product_price
    ADD COLUMN product_id BIGINT UNSIGNED NULL AFTER id,
    ADD COLUMN shop_type VARCHAR(32) NOT NULL DEFAULT 'OTHER' AFTER seller,
    ADD COLUMN coupon_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER price,
    ADD COLUMN full_reduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER coupon_amount,
    ADD COLUMN member_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER full_reduction_amount,
    ADD COLUMN platform_subsidy_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER member_discount_amount,
    ADD COLUMN shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER platform_subsidy_amount,
    ADD COLUMN final_price DECIMAL(12,2) NULL AFTER shipping_fee,
    ADD COLUMN sales_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER final_price,
    ADD COLUMN rating DECIMAL(3,2) NOT NULL DEFAULT 0 AFTER sales_count,
    ADD COLUMN seller_score DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER rating,
    ADD COLUMN stock_status VARCHAR(24) NOT NULL DEFAULT 'IN_STOCK' AFTER in_stock,
    ADD COLUMN promotion_json JSON NULL AFTER stock_status,
    ADD COLUMN affiliate_url VARCHAR(1000) NOT NULL DEFAULT '' AFTER product_url,
    ADD COLUMN record_source VARCHAR(32) NOT NULL DEFAULT 'INTERNAL' AFTER affiliate_url,
    ADD COLUMN is_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER record_source,
    ADD COLUMN is_reviewed TINYINT(1) NOT NULL DEFAULT 1 AFTER is_enabled;

INSERT INTO product (
    product_key,
    hardware_id,
    title,
    brand,
    model,
    category,
    image_url,
    description,
    normalized_title,
    spec_json,
    match_confidence,
    match_status,
    status,
    record_source
)
SELECT
    CONCAT('legacy-', pp.id),
    h.id,
    h.name,
    h.brand,
    h.hardware_key,
    h.category_code,
    h.cover_url,
    'Migrated internal reference product',
    UPPER(h.search_key),
    JSON_OBJECT('hardwareKey', h.hardware_key),
    1.0000,
    'CONFIRMED',
    'ACTIVE',
    'INTERNAL'
FROM product_price pp
JOIN hardware h ON h.id = pp.hardware_id;

UPDATE product_price pp
JOIN product p ON p.product_key = CONCAT('legacy-', pp.id)
SET pp.product_id = p.id,
    pp.final_price = pp.price,
    pp.stock_status = CASE WHEN pp.in_stock = 1 THEN 'IN_STOCK' ELSE 'OUT_OF_STOCK' END,
    pp.record_source = 'INTERNAL';

ALTER TABLE product_price
    DROP FOREIGN KEY fk_price_hardware,
    DROP INDEX uk_product_price_source,
    DROP INDEX idx_product_price_value,
    DROP INDEX idx_product_price_stock,
    DROP CHECK chk_product_price_value;

ALTER TABLE product_price
    CHANGE COLUMN source platform VARCHAR(32) NOT NULL DEFAULT 'INTERNAL',
    CHANGE COLUMN price sale_price DECIMAL(12,2) NOT NULL,
    MODIFY COLUMN product_id BIGINT UNSIGNED NOT NULL,
    MODIFY COLUMN final_price DECIMAL(12,2) NOT NULL,
    DROP COLUMN hardware_id,
    DROP COLUMN in_stock,
    ADD UNIQUE KEY uk_product_price_offer (product_id, platform, seller),
    ADD KEY idx_product_price_value (final_price),
    ADD KEY idx_product_price_stock (stock_status, is_enabled),
    ADD KEY idx_product_price_platform (platform, checked_at),
    ADD CONSTRAINT fk_price_product FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    ADD CONSTRAINT chk_product_price_sale CHECK (sale_price >= 0),
    ADD CONSTRAINT chk_product_price_final CHECK (final_price >= 0),
    ADD CONSTRAINT chk_product_price_rating CHECK (rating >= 0 AND rating <= 5),
    ADD CONSTRAINT chk_product_price_seller_score CHECK (seller_score >= 0 AND seller_score <= 100);

UPDATE product_price
SET final_price = sale_price
WHERE record_source = 'INTERNAL';

CREATE TABLE price_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    offer_id BIGINT UNSIGNED NULL,
    platform VARCHAR(32) NOT NULL,
    sale_price DECIMAL(12,2) NOT NULL,
    final_price DECIMAL(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'CNY',
    stock_status VARCHAR(24) NOT NULL DEFAULT 'IN_STOCK',
    record_source VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
    recorded_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_price_history_product_time (product_id, recorded_at),
    KEY idx_price_history_offer_time (offer_id, recorded_at),
    CONSTRAINT fk_history_product FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT fk_history_offer FOREIGN KEY (offer_id) REFERENCES product_price (id) ON DELETE SET NULL,
    CONSTRAINT chk_price_history_final CHECK (final_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE price_click_event (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    offer_id BIGINT UNSIGNED NOT NULL,
    hardware_id BIGINT UNSIGNED NULL,
    platform VARCHAR(32) NOT NULL,
    session_id VARCHAR(80) NOT NULL DEFAULT '',
    build_public_id CHAR(36) NULL,
    source_surface VARCHAR(48) NOT NULL DEFAULT 'BUILDER',
    redirect_host VARCHAR(255) NOT NULL,
    ip_hash CHAR(64) NOT NULL DEFAULT '',
    user_agent_hash CHAR(64) NOT NULL DEFAULT '',
    clicked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_click_offer_time (offer_id, clicked_at),
    KEY idx_click_hardware_time (hardware_id, clicked_at),
    KEY idx_click_platform_time (platform, clicked_at),
    CONSTRAINT fk_click_offer FOREIGN KEY (offer_id) REFERENCES product_price (id) ON DELETE RESTRICT,
    CONSTRAINT fk_click_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE price_search_event (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    keyword VARCHAR(160) NOT NULL,
    normalized_keyword VARCHAR(160) NOT NULL,
    category_code VARCHAR(32) NULL,
    result_count INT UNSIGNED NOT NULL DEFAULT 0,
    session_id VARCHAR(80) NOT NULL DEFAULT '',
    source_surface VARCHAR(48) NOT NULL DEFAULT 'BUILDER',
    searched_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_search_keyword_time (normalized_keyword, searched_at),
    KEY idx_search_category_time (category_code, searched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_match_audit (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    hardware_id BIGINT UNSIGNED NULL,
    confidence DECIMAL(5,4) NOT NULL,
    decision VARCHAR(24) NOT NULL,
    dimension_scores_json JSON NOT NULL,
    explanation VARCHAR(1000) NOT NULL DEFAULT '',
    reviewed_by VARCHAR(80) NOT NULL DEFAULT '',
    reviewed_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_match_audit_product_time (product_id, created_at),
    KEY idx_match_audit_decision (decision, confidence),
    CONSTRAINT fk_match_audit_product FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT fk_match_audit_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE SET NULL,
    CONSTRAINT chk_match_audit_confidence CHECK (confidence >= 0 AND confidence <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO product (
    product_key, hardware_id, title, brand, model, category, image_url, description,
    normalized_title, spec_json, match_confidence, match_status, status, record_source
)
SELECT 'manual-jd-rtx5090', id, 'ASUS RTX 5090 32GB Gaming OC', 'ASUS', 'RTX 5090', 'GPU',
       cover_url, '演示报价，发布前请在价格后台替换为已核验商品', 'ASUS RTX5090 32GB GAMING OC',
       JSON_OBJECT('vramGb', 32), 0.9800, 'CONFIRMED', 'ACTIVE', 'MANUAL_DEMO'
FROM hardware WHERE hardware_key = 'gpu-nvidia-rtx5090'
UNION ALL
SELECT 'manual-taobao-rtx5090', id, '华硕 RTX5090 OC 32G', 'ASUS', 'RTX 5090', 'GPU',
       cover_url, '演示报价，发布前请在价格后台替换为已核验商品', 'ASUS RTX5090 OC 32G',
       JSON_OBJECT('vramGb', 32), 0.9700, 'CONFIRMED', 'ACTIVE', 'MANUAL_DEMO'
FROM hardware WHERE hardware_key = 'gpu-nvidia-rtx5090'
UNION ALL
SELECT 'manual-pdd-rtx5090', id, 'ASUS RTX 5090 32GB 显卡', 'ASUS', 'RTX 5090', 'GPU',
       cover_url, '演示报价，发布前请在价格后台替换为已核验商品', 'ASUS RTX5090 32GB',
       JSON_OBJECT('vramGb', 32), 0.9600, 'CONFIRMED', 'ACTIVE', 'MANUAL_DEMO'
FROM hardware WHERE hardware_key = 'gpu-nvidia-rtx5090'
UNION ALL
SELECT 'manual-jd-i9-14900k', id, 'Intel Core i9-14900K 盒装', 'Intel', 'i9-14900K', 'CPU',
       cover_url, '演示报价，发布前请在价格后台替换为已核验商品', 'INTEL I9 14900K',
       JSON_OBJECT('socket', 'LGA1700'), 0.9900, 'CONFIRMED', 'ACTIVE', 'MANUAL_DEMO'
FROM hardware WHERE hardware_key = 'cpu-intel-i9-14900k'
UNION ALL
SELECT 'manual-taobao-i9-14900k', id, '英特尔 i9 14900K 24核', 'Intel', 'i9-14900K', 'CPU',
       cover_url, '演示报价，发布前请在价格后台替换为已核验商品', 'INTEL I9 14900K 24 CORE',
       JSON_OBJECT('socket', 'LGA1700'), 0.9700, 'CONFIRMED', 'ACTIVE', 'MANUAL_DEMO'
FROM hardware WHERE hardware_key = 'cpu-intel-i9-14900k'
UNION ALL
SELECT 'manual-pdd-i9-14900k', id, 'Intel i9-14900K CPU', 'Intel', 'i9-14900K', 'CPU',
       cover_url, '演示报价，发布前请在价格后台替换为已核验商品', 'INTEL I9 14900K CPU',
       JSON_OBJECT('socket', 'LGA1700'), 0.9500, 'CONFIRMED', 'ACTIVE', 'MANUAL_DEMO'
FROM hardware WHERE hardware_key = 'cpu-intel-i9-14900k';

INSERT INTO product_price (
    product_id, platform, seller, shop_type, sale_price, coupon_amount,
    full_reduction_amount, member_discount_amount, platform_subsidy_amount,
    shipping_fee, final_price, sales_count, rating, seller_score, currency,
    stock_status, promotion_json, product_url, affiliate_url, record_source,
    is_enabled, is_reviewed, checked_at
)
SELECT id, 'JD', '京东自营 · 演示报价', 'SELF_OPERATED', 23999, 200, 300, 0, 0,
       0, 23499, 3200, 4.90, 98, 'CNY', 'IN_STOCK',
       JSON_OBJECT('notice', 'MANUAL_DEMO'), 'https://search.jd.com/Search?keyword=RTX5090',
       '', 'MANUAL_DEMO', 1, 1, CURRENT_TIMESTAMP(3)
FROM product WHERE product_key = 'manual-jd-rtx5090'
UNION ALL
SELECT id, 'TAOBAO', '淘宝品牌店 · 演示报价', 'BRAND_STORE', 23199, 100, 200, 0, 100,
       0, 22799, 1800, 4.80, 91, 'CNY', 'IN_STOCK',
       JSON_OBJECT('notice', 'MANUAL_DEMO'), 'https://s.taobao.com/search?q=RTX5090',
       '', 'MANUAL_DEMO', 1, 1, CURRENT_TIMESTAMP(3)
FROM product WHERE product_key = 'manual-taobao-rtx5090'
UNION ALL
SELECT id, 'PDD', '平台补贴店 · 演示报价', 'MARKETPLACE', 22699, 100, 0, 0, 300,
       0, 22299, 900, 4.60, 82, 'CNY', 'IN_STOCK',
       JSON_OBJECT('notice', 'MANUAL_DEMO'), 'https://mobile.yangkeduo.com/search_result.html?search_key=RTX5090',
       '', 'MANUAL_DEMO', 1, 1, CURRENT_TIMESTAMP(3)
FROM product WHERE product_key = 'manual-pdd-rtx5090'
UNION ALL
SELECT id, 'JD', '京东自营 · 演示报价', 'SELF_OPERATED', 3699, 100, 100, 0, 0,
       0, 3499, 8200, 4.90, 98, 'CNY', 'IN_STOCK',
       JSON_OBJECT('notice', 'MANUAL_DEMO'), 'https://search.jd.com/Search?keyword=i9-14900K',
       '', 'MANUAL_DEMO', 1, 1, CURRENT_TIMESTAMP(3)
FROM product WHERE product_key = 'manual-jd-i9-14900k'
UNION ALL
SELECT id, 'TAOBAO', '淘宝品牌店 · 演示报价', 'BRAND_STORE', 3499, 50, 100, 0, 50,
       0, 3299, 5400, 4.80, 91, 'CNY', 'IN_STOCK',
       JSON_OBJECT('notice', 'MANUAL_DEMO'), 'https://s.taobao.com/search?q=i9-14900K',
       '', 'MANUAL_DEMO', 1, 1, CURRENT_TIMESTAMP(3)
FROM product WHERE product_key = 'manual-taobao-i9-14900k'
UNION ALL
SELECT id, 'PDD', '平台补贴店 · 演示报价', 'MARKETPLACE', 3399, 0, 0, 0, 200,
       0, 3199, 2600, 4.60, 82, 'CNY', 'IN_STOCK',
       JSON_OBJECT('notice', 'MANUAL_DEMO'), 'https://mobile.yangkeduo.com/search_result.html?search_key=i9-14900K',
       '', 'MANUAL_DEMO', 1, 1, CURRENT_TIMESTAMP(3)
FROM product WHERE product_key = 'manual-pdd-i9-14900k';

INSERT INTO price_history (
    product_id, offer_id, platform, sale_price, final_price, currency,
    stock_status, record_source, recorded_at
)
SELECT
    pp.product_id,
    pp.id,
    pp.platform,
    pp.sale_price,
    GREATEST(
        0,
        pp.final_price + (CAST(MOD(days.day_offset + pp.id, 7) AS SIGNED) - 3) * 18
    ),
    pp.currency,
    pp.stock_status,
    pp.record_source,
    DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL days.day_offset DAY)
FROM product_price pp
JOIN product p ON p.id = pp.product_id AND p.record_source = 'MANUAL_DEMO'
CROSS JOIN (
    SELECT 0 day_offset UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
    UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
    UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
    UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
    UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23
    UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27
    UNION ALL SELECT 28 UNION ALL SELECT 29
) days;
