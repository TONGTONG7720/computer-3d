CREATE TABLE hardware_category (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    builder_category VARCHAR(32) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_hardware_category_code (code),
    KEY idx_hardware_category_builder (builder_category, enabled),
    KEY idx_hardware_category_sort (sort_order, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    role VARCHAR(24) NOT NULL DEFAULT 'USER',
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    KEY idx_users_role_status (role, status, deleted),
    CONSTRAINT chk_users_status CHECK (status IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE hardware (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hardware_key VARCHAR(80) NOT NULL,
    name VARCHAR(160) NOT NULL,
    brand VARCHAR(80) NOT NULL,
    category_code VARCHAR(32) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    base_price DECIMAL(12,2) NOT NULL,
    performance_score TINYINT UNSIGNED NOT NULL,
    power_watt SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    model_url VARCHAR(500) NOT NULL DEFAULT '',
    model_variant VARCHAR(80) NOT NULL DEFAULT '',
    cover_url VARCHAR(500) NOT NULL DEFAULT '',
    search_key VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    version INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_hardware_key (hardware_key),
    KEY idx_hardware_name (name),
    KEY idx_hardware_brand_status (brand, status, deleted),
    KEY idx_hardware_category_status (category_code, status, deleted, sort_order),
    KEY idx_hardware_price_performance (base_price, performance_score),
    KEY idx_hardware_power (power_watt),
    KEY idx_hardware_search_key (search_key),
    CONSTRAINT fk_hardware_category FOREIGN KEY (category_code) REFERENCES hardware_category (code),
    CONSTRAINT chk_hardware_price CHECK (base_price >= 0),
    CONSTRAINT chk_hardware_performance CHECK (performance_score BETWEEN 0 AND 100),
    CONSTRAINT chk_hardware_status CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cpu_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    socket VARCHAR(32) NOT NULL,
    cores SMALLINT UNSIGNED NOT NULL,
    threads SMALLINT UNSIGNED NOT NULL,
    base_clock_ghz DECIMAL(4,2) NOT NULL,
    boost_clock_ghz DECIMAL(4,2) NOT NULL,
    tdp_watt SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_cpu_socket (socket),
    KEY idx_cpu_cores (cores),
    KEY idx_cpu_tdp (tdp_watt),
    CONSTRAINT fk_cpu_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE gpu_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    chipset VARCHAR(80) NOT NULL,
    vram_gb SMALLINT UNSIGNED NOT NULL,
    vram_type VARCHAR(24) NOT NULL,
    length_mm SMALLINT UNSIGNED NOT NULL,
    tdp_watt SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_gpu_vram (vram_gb),
    KEY idx_gpu_length (length_mm),
    CONSTRAINT fk_gpu_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE motherboard_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    socket VARCHAR(32) NOT NULL,
    ram_type VARCHAR(16) NOT NULL,
    form_factor VARCHAR(24) NOT NULL,
    memory_slots TINYINT UNSIGNED NOT NULL,
    max_memory_gb SMALLINT UNSIGNED NOT NULL,
    pcie_version VARCHAR(16) NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_motherboard_socket (socket),
    KEY idx_motherboard_ram (ram_type),
    KEY idx_motherboard_form_factor (form_factor),
    CONSTRAINT fk_motherboard_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE memory_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    capacity_gb SMALLINT UNSIGNED NOT NULL,
    generation VARCHAR(16) NOT NULL,
    frequency_mhz INT UNSIGNED NOT NULL,
    module_count TINYINT UNSIGNED NOT NULL,
    latency VARCHAR(24) NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_memory_generation (generation),
    KEY idx_memory_capacity (capacity_gb),
    KEY idx_memory_frequency (frequency_mhz),
    CONSTRAINT fk_memory_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE storage_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    storage_type VARCHAR(16) NOT NULL,
    capacity_gb INT UNSIGNED NOT NULL,
    interface_type VARCHAR(32) NOT NULL,
    read_speed_mbps INT UNSIGNED NOT NULL,
    write_speed_mbps INT UNSIGNED NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_storage_type (storage_type),
    KEY idx_storage_capacity (capacity_gb),
    CONSTRAINT fk_storage_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cooling_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    cooling_type VARCHAR(24) NOT NULL,
    max_tdp_watt SMALLINT UNSIGNED NOT NULL,
    radiator_size_mm SMALLINT UNSIGNED NOT NULL,
    supported_sockets JSON NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_cooling_type (cooling_type),
    KEY idx_cooling_tdp (max_tdp_watt),
    CONSTRAINT fk_cooling_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE psu_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    wattage SMALLINT UNSIGNED NOT NULL,
    certification VARCHAR(24) NOT NULL,
    modular_type VARCHAR(24) NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_psu_wattage (wattage),
    KEY idx_psu_certification (certification),
    CONSTRAINT fk_psu_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE case_spec (
    hardware_id BIGINT UNSIGNED NOT NULL,
    gpu_max_length_mm SMALLINT UNSIGNED NOT NULL,
    motherboard_sizes JSON NOT NULL,
    radiator_max_size_mm SMALLINT UNSIGNED NOT NULL,
    cooler_max_height_mm SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (hardware_id),
    KEY idx_case_gpu_length (gpu_max_length_mm),
    KEY idx_case_radiator (radiator_max_size_mm),
    CONSTRAINT fk_case_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE hardware_model (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hardware_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    glb_url VARCHAR(500) NOT NULL,
    texture_url VARCHAR(500) NOT NULL DEFAULT '',
    preview_url VARCHAR(500) NOT NULL DEFAULT '',
    scale_x DECIMAL(10,5) NOT NULL DEFAULT 1.00000,
    scale_y DECIMAL(10,5) NOT NULL DEFAULT 1.00000,
    scale_z DECIMAL(10,5) NOT NULL DEFAULT 1.00000,
    position_x DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
    position_y DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
    position_z DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
    rotation_x DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
    rotation_y DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
    rotation_z DECIMAL(10,5) NOT NULL DEFAULT 0.00000,
    lod_level TINYINT UNSIGNED NOT NULL DEFAULT 0,
    file_size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
    checksum_sha256 CHAR(64) NOT NULL DEFAULT '',
    is_primary TINYINT(1) NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'READY',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_hardware_model_lod (hardware_id, lod_level),
    KEY idx_hardware_model_primary (hardware_id, is_primary, status),
    KEY idx_hardware_model_checksum (checksum_sha256),
    CONSTRAINT fk_model_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE,
    CONSTRAINT chk_hardware_model_status CHECK (status IN ('PROCESSING', 'READY', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_price (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hardware_id BIGINT UNSIGNED NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'INTERNAL',
    seller VARCHAR(120) NOT NULL DEFAULT 'PC LAB',
    price DECIMAL(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'CNY',
    in_stock TINYINT(1) NOT NULL DEFAULT 1,
    product_url VARCHAR(500) NOT NULL DEFAULT '',
    checked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_price_source (hardware_id, source, seller),
    KEY idx_product_price_value (price),
    KEY idx_product_price_stock (in_stock),
    KEY idx_product_price_checked (checked_at),
    CONSTRAINT fk_price_hardware FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE,
    CONSTRAINT chk_product_price_value CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE build_config (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    components_json JSON NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    performance_score TINYINT UNSIGNED NOT NULL,
    power_usage_watt SMALLINT UNSIGNED NOT NULL,
    compatibility_status VARCHAR(20) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_build_config_public_id (public_id),
    KEY idx_build_config_user (user_id, created_at),
    KEY idx_build_config_name (name),
    KEY idx_build_config_price (total_price),
    KEY idx_build_config_compatibility (compatibility_status),
    CONSTRAINT fk_build_config_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_build_performance CHECK (performance_score BETWEEN 0 AND 100),
    CONSTRAINT chk_build_compatibility CHECK (compatibility_status IN ('SUCCESS', 'WARNING', 'ERROR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
