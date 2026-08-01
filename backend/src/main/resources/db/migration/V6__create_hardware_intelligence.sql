ALTER TABLE hardware
    ADD COLUMN popularity_score INT UNSIGNED NOT NULL DEFAULT 0 AFTER performance_score,
    ADD KEY idx_hardware_popularity (popularity_score, status, deleted);

ALTER TABLE cpu_spec
    ADD COLUMN generation VARCHAR(48) NOT NULL DEFAULT '' AFTER socket;

ALTER TABLE gpu_spec
    ADD COLUMN interface_type VARCHAR(32) NOT NULL DEFAULT 'PCIe 5.0' AFTER vram_type,
    ADD COLUMN resolution_support JSON NULL AFTER interface_type;

ALTER TABLE motherboard_spec
    ADD COLUMN chipset VARCHAR(48) NOT NULL DEFAULT '' AFTER socket;

ALTER TABLE psu_spec
    ADD COLUMN connectors JSON NULL AFTER modular_type;

ALTER TABLE hardware_model
    ADD COLUMN animation_config JSON NULL AFTER rotation_z;

UPDATE cpu_spec
SET generation = CASE
    WHEN hardware_id = (SELECT id FROM hardware WHERE hardware_key = 'cpu-intel-i9-14900k')
        THEN 'Raptor Lake Refresh'
    WHEN hardware_id = (SELECT id FROM hardware WHERE hardware_key = 'cpu-amd-7800x3d')
        THEN 'Zen 4'
    ELSE 'Reviewed'
END;

UPDATE gpu_spec
SET resolution_support = JSON_ARRAY('1080p', '1440p', '4K');

UPDATE psu_spec
SET connectors = JSON_ARRAY('24-pin ATX', '8-pin EPS', '12V-2x6');

UPDATE hardware_model
SET animation_config = JSON_OBJECT(
    'durationMs', 1200,
    'ease', 'power3.out',
    'entryAxis', 'slot'
);

ALTER TABLE gpu_spec
    MODIFY COLUMN resolution_support JSON NOT NULL;

ALTER TABLE psu_spec
    MODIFY COLUMN connectors JSON NOT NULL;

ALTER TABLE hardware_model
    MODIFY COLUMN animation_config JSON NOT NULL;

UPDATE motherboard_spec
SET chipset = CASE
    WHEN hardware_id = (SELECT id FROM hardware WHERE hardware_key = 'motherboard-z790-lab')
        THEN 'Z790'
    WHEN hardware_id = (SELECT id FROM hardware WHERE hardware_key = 'motherboard-b650-lab')
        THEN 'B650'
    WHEN hardware_id = (SELECT id FROM hardware WHERE hardware_key = 'motherboard-b760-d4-lab')
        THEN 'B760'
    ELSE 'Reviewed'
END;

UPDATE hardware
SET popularity_score = CASE hardware_key
    WHEN 'gpu-nvidia-rtx5090' THEN 100
    WHEN 'cpu-amd-7800x3d' THEN 96
    WHEN 'cpu-intel-i9-14900k' THEN 94
    WHEN 'gpu-nvidia-rtx5080' THEN 92
    WHEN 'case-future-glass' THEN 90
    WHEN 'ram-ddr5-32gb' THEN 88
    WHEN 'ram-ddr5-64gb' THEN 86
    WHEN 'gpu-amd-rx8900xt' THEN 84
    ELSE performance_score
END;

CREATE TABLE hardware_performance_data (
    hardware_id BIGINT UNSIGNED NOT NULL,
    gaming_score TINYINT UNSIGNED NOT NULL,
    creator_score TINYINT UNSIGNED NOT NULL,
    ai_score TINYINT UNSIGNED NOT NULL,
    source VARCHAR(80) NOT NULL DEFAULT 'PC LAB reviewed index',
    profile_version INT UNSIGNED NOT NULL DEFAULT 1,
    measured_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (hardware_id),
    KEY idx_hardware_performance_gaming (gaming_score),
    KEY idx_hardware_performance_creator (creator_score),
    KEY idx_hardware_performance_ai (ai_score),
    CONSTRAINT fk_hardware_performance_hardware
        FOREIGN KEY (hardware_id) REFERENCES hardware (id) ON DELETE CASCADE,
    CONSTRAINT chk_hardware_performance_gaming CHECK (gaming_score BETWEEN 0 AND 100),
    CONSTRAINT chk_hardware_performance_creator CHECK (creator_score BETWEEN 0 AND 100),
    CONSTRAINT chk_hardware_performance_ai CHECK (ai_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO hardware_performance_data (
    hardware_id,
    gaming_score,
    creator_score,
    ai_score,
    source
)
SELECT
    id,
    CASE hardware_key
        WHEN 'cpu-intel-i9-14900k' THEN 94
        WHEN 'cpu-amd-7800x3d' THEN 98
        WHEN 'gpu-nvidia-rtx5090' THEN 100
        WHEN 'gpu-nvidia-rtx5080' THEN 90
        WHEN 'gpu-amd-rx8900xt' THEN 86
        WHEN 'gpu-nvidia-rtx5070' THEN 72
        WHEN 'ram-ddr5-64gb' THEN 96
        WHEN 'ram-ddr5-32gb' THEN 80
        WHEN 'ram-ddr4-32gb' THEN 62
        WHEN 'storage-nvme-4tb' THEN 94
        WHEN 'storage-nvme-1tb' THEN 72
        ELSE performance_score
    END,
    CASE hardware_key
        WHEN 'cpu-intel-i9-14900k' THEN 100
        WHEN 'cpu-amd-7800x3d' THEN 86
        WHEN 'gpu-nvidia-rtx5090' THEN 100
        WHEN 'gpu-nvidia-rtx5080' THEN 92
        WHEN 'gpu-amd-rx8900xt' THEN 84
        WHEN 'gpu-nvidia-rtx5070' THEN 70
        WHEN 'ram-ddr5-64gb' THEN 100
        WHEN 'ram-ddr5-32gb' THEN 78
        WHEN 'ram-ddr4-32gb' THEN 60
        WHEN 'storage-nvme-4tb' THEN 98
        WHEN 'storage-nvme-1tb' THEN 70
        ELSE performance_score
    END,
    CASE hardware_key
        WHEN 'cpu-intel-i9-14900k' THEN 96
        WHEN 'cpu-amd-7800x3d' THEN 80
        WHEN 'gpu-nvidia-rtx5090' THEN 100
        WHEN 'gpu-nvidia-rtx5080' THEN 88
        WHEN 'gpu-amd-rx8900xt' THEN 68
        WHEN 'gpu-nvidia-rtx5070' THEN 64
        WHEN 'ram-ddr5-64gb' THEN 100
        WHEN 'ram-ddr5-32gb' THEN 76
        WHEN 'ram-ddr4-32gb' THEN 54
        WHEN 'storage-nvme-4tb' THEN 90
        WHEN 'storage-nvme-1tb' THEN 66
        ELSE performance_score
    END,
    'PC LAB reviewed index V1'
FROM hardware
WHERE deleted = 0;

CREATE TABLE compatibility_rule (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(64) NOT NULL,
    source_category VARCHAR(32) NOT NULL,
    target_category VARCHAR(32) NOT NULL,
    rule_type VARCHAR(40) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    message_template VARCHAR(300) NOT NULL,
    config_json JSON NOT NULL,
    priority INT NOT NULL DEFAULT 100,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    version INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_compatibility_rule_code (code),
    KEY idx_compatibility_rule_runtime (enabled, priority, rule_type),
    KEY idx_compatibility_rule_categories (source_category, target_category),
    CONSTRAINT chk_compatibility_rule_type CHECK (rule_type IN (
        'SOCKET_MATCH',
        'MEMORY_GENERATION',
        'GPU_CLEARANCE',
        'CPU_COOLING_TDP',
        'COOLER_SOCKET',
        'MOTHERBOARD_FORM_FACTOR',
        'RADIATOR_CLEARANCE',
        'PSU_HEADROOM'
    )),
    CONSTRAINT chk_compatibility_rule_severity CHECK (severity IN ('ERROR', 'WARNING'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO compatibility_rule (
    code,
    source_category,
    target_category,
    rule_type,
    severity,
    message_template,
    config_json,
    priority
) VALUES
    ('CPU_MOTHERBOARD_SOCKET', 'CPU', 'MOTHERBOARD', 'SOCKET_MATCH', 'ERROR',
     'CPU 与主板插槽不一致', JSON_OBJECT(), 10),
    ('RAM_MOTHERBOARD_GENERATION', 'RAM', 'MOTHERBOARD', 'MEMORY_GENERATION', 'ERROR',
     '内存代际与主板不一致', JSON_OBJECT(), 20),
    ('GPU_CASE_CLEARANCE', 'GPU', 'CASE', 'GPU_CLEARANCE', 'ERROR',
     '显卡长度超过机箱空间', JSON_OBJECT(), 30),
    ('CPU_COOLER_CAPACITY', 'CPU', 'COOLING', 'CPU_COOLING_TDP', 'ERROR',
     '散热能力低于处理器 TDP', JSON_OBJECT(), 40),
    ('CPU_COOLER_SOCKET', 'CPU', 'COOLING', 'COOLER_SOCKET', 'ERROR',
     '散热器不支持处理器插槽', JSON_OBJECT(), 50),
    ('MOTHERBOARD_CASE_FORM_FACTOR', 'MOTHERBOARD', 'CASE', 'MOTHERBOARD_FORM_FACTOR', 'ERROR',
     '主板尺寸不受机箱支持', JSON_OBJECT(), 60),
    ('COOLER_CASE_RADIATOR', 'COOLING', 'CASE', 'RADIATOR_CLEARANCE', 'ERROR',
     '冷排尺寸超过机箱上限', JSON_OBJECT(), 70),
    ('SYSTEM_PSU_HEADROOM', 'PSU', 'BUILD', 'PSU_HEADROOM', 'WARNING',
     '电源余量低于建议值', JSON_OBJECT('reserveWatt', 75, 'headroomRatio', 1.20, 'roundingWatt', 50), 80);
