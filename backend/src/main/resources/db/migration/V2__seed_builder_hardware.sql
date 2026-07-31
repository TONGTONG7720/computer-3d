INSERT INTO hardware_category (code, name, builder_category, sort_order, enabled) VALUES
    ('CPU', '处理器', 'cpu', 10, 1),
    ('GPU', '显卡', 'gpu', 20, 1),
    ('MOTHERBOARD', '主板', 'motherboard', 30, 1),
    ('RAM', '内存', 'ram', 40, 1),
    ('SSD', '固态硬盘', 'storage', 50, 1),
    ('HDD', '机械硬盘', 'storage', 60, 1),
    ('COOLING', '散热', 'cooling', 70, 1),
    ('PSU', '电源', 'power_supply', 80, 1),
    ('CASE', '机箱', 'case', 90, 1);

INSERT INTO hardware (
    hardware_key, name, brand, category_code, description, base_price,
    performance_score, power_watt, model_url, model_variant, cover_url,
    search_key, sort_order, status
) VALUES
    ('cpu-intel-i9-14900k', 'Intel Core i9-14900K', 'Intel', 'CPU', '24 核旗舰桌面处理器', 3999.00, 96, 253, '/models/cpu_i9_14900k.glb', 'intel-i9', '', 'cpuintelcorei914900kintel14900k', 10, 'ACTIVE'),
    ('cpu-amd-7800x3d', 'AMD Ryzen 7 7800X3D', 'AMD', 'CPU', '面向游戏的 3D V-Cache 处理器', 2199.00, 90, 120, '/models/cpu_ryzen_7800x3d.glb', 'amd-7800x3d', '', 'cpuamdryzen77800x3damd7800x3d', 20, 'ACTIVE'),
    ('gpu-nvidia-rtx5090', 'NVIDIA GeForce RTX 5090', 'NVIDIA', 'GPU', '32GB 旗舰级 GPU', 15999.00, 100, 575, '/models/gpu_rtx5090.glb', 'rtx5090', '', 'gpunvidiageforcertx5090nvidiartx5090', 10, 'ACTIVE'),
    ('gpu-nvidia-rtx5080', 'NVIDIA GeForce RTX 5080', 'NVIDIA', 'GPU', '16GB 高性能 GPU', 8999.00, 88, 360, '/models/gpu_rtx5080.glb', 'rtx5080', '', 'gpunvidiageforcertx5080nvidiartx5080', 20, 'ACTIVE'),
    ('gpu-amd-rx8900xt', 'AMD Radeon RX 8900 XT', 'AMD', 'GPU', '24GB 高性能 Radeon GPU', 6499.00, 84, 355, '/models/gpu_rx8900xt.glb', 'rx8900xt', '', 'gpuamdradeonrx8900xtamdrx8900xt', 30, 'ACTIVE'),
    ('gpu-nvidia-rtx5070', 'NVIDIA GeForce RTX 5070', 'NVIDIA', 'GPU', '12GB 主流高性能 GPU', 2799.00, 70, 250, '/models/gpu_rtx5070.glb', 'rtx5070', '', 'gpunvidiageforcertx5070nvidiartx5070', 40, 'ACTIVE'),
    ('motherboard-z790-lab', 'Z790 LAB', 'PC LAB', 'MOTHERBOARD', 'LGA1700 DDR5 ATX 主板', 2399.00, 96, 65, '/models/motherboard_z790_lab.glb', 'z790', '', 'motherboardz790labpclabz790', 10, 'ACTIVE'),
    ('motherboard-b650-lab', 'B650M LAB', 'PC LAB', 'MOTHERBOARD', 'AM5 DDR5 Micro-ATX 主板', 699.00, 72, 45, '/models/motherboard_b650m_lab.glb', 'b650', '', 'motherboardb650mlabpclabb650', 20, 'ACTIVE'),
    ('motherboard-b760-d4-lab', 'B760M D4 LAB', 'PC LAB', 'MOTHERBOARD', 'LGA1700 DDR4 Micro-ATX 主板', 799.00, 68, 45, '/models/motherboard_b760_d4_lab.glb', 'b760-d4', '', 'motherboardb760md4labpclabb760d4', 30, 'ACTIVE'),
    ('ram-ddr5-64gb', 'Spectral DDR5 64GB', 'PC LAB', 'RAM', '双通道高频 DDR5 内存', 1199.00, 94, 18, '/models/ram_ddr5_64gb.glb', 'ddr5-64', '', 'ramspectralddr564gbpclabddr564', 10, 'ACTIVE'),
    ('ram-ddr5-32gb', 'Spectral DDR5 32GB', 'PC LAB', 'RAM', '双通道 DDR5 内存', 399.00, 74, 10, '/models/ram_ddr5_32gb.glb', 'ddr5-32', '', 'ramspectralddr532gbpclabddr532', 20, 'ACTIVE'),
    ('ram-ddr4-32gb', 'Core DDR4 32GB', 'PC LAB', 'RAM', '双通道 DDR4 内存', 299.00, 56, 9, '/models/ram_ddr4_32gb.glb', 'ddr4-32', '', 'ramcoreddr432gbpclabddr432', 30, 'ACTIVE'),
    ('storage-nvme-4tb', 'Nebula NVMe 4TB', 'PC LAB', 'SSD', 'PCIe 5.0 NVMe 固态硬盘', 1599.00, 92, 10, '/models/storage_nvme_4tb.glb', 'nvme-4tb', '', 'storagessdnebulanvme4tbpclabnvme4tb', 10, 'ACTIVE'),
    ('storage-nvme-1tb', 'Pulse NVMe 1TB', 'PC LAB', 'SSD', 'PCIe 4.0 NVMe 固态硬盘', 299.00, 68, 7, '/models/storage_nvme_1tb.glb', 'nvme-1tb', '', 'storagessdpulsenvme1tbpclabnvme1tb', 20, 'ACTIVE'),
    ('cooling-tower-160', 'Core Tower 160', 'PC LAB', 'COOLING', '160W 塔式风冷', 199.00, 62, 5, '/models/cooling_tower_160.glb', 'tower', '', 'coolingcoretower160pclabtower', 10, 'ACTIVE'),
    ('cooling-aio-240', 'LAB AIO 240', 'PC LAB', 'COOLING', '240mm 一体式水冷', 399.00, 76, 14, '/models/cooling_aio_240.glb', 'aio-240', '', 'coolinglabaio240pclabaio240', 20, 'ACTIVE'),
    ('cooling-aio-360', 'LAB AIO 360', 'PC LAB', 'COOLING', '360mm 一体式水冷', 899.00, 96, 22, '/models/cooling_aio_360.glb', 'aio-360', '', 'coolinglabaio360pclabaio360', 30, 'ACTIVE'),
    ('psu-850w-gold', '850W Gold', 'PC LAB', 'PSU', '850W 80 PLUS Gold 电源', 449.00, 71, 0, '/models/psu_850w.glb', '850w', '', 'psu850wgoldpclab850w', 10, 'ACTIVE'),
    ('psu-1000w-platinum', '1000W Platinum', 'PC LAB', 'PSU', '1000W 80 PLUS Platinum 电源', 699.00, 83, 0, '/models/psu_1000w.glb', '1000w', '', 'psu1000wplatinumpclab1000w', 20, 'ACTIVE'),
    ('psu-1200w-platinum', '1200W Platinum', 'PC LAB', 'PSU', '1200W 80 PLUS Platinum 电源', 999.00, 100, 0, '/models/psu_1200w.glb', '1200w', '', 'psu1200wplatinumpclab1200w', 30, 'ACTIVE'),
    ('case-future-glass', 'Future Glass Case', 'PC LAB', 'CASE', '全景玻璃未来机箱', 1299.00, 94, 8, '/models/case_future_glass.glb', 'future-glass', '', 'casefutureglasscasepclabfutureglass', 10, 'ACTIVE'),
    ('case-compact-lab', 'Compact LAB Case', 'PC LAB', 'CASE', '紧凑型 Micro-ATX 机箱', 399.00, 66, 6, '/models/case_compact_lab.glb', 'compact', '', 'casecompactlabcasepclabcompact', 20, 'ACTIVE');

INSERT INTO cpu_spec (hardware_id, socket, cores, threads, base_clock_ghz, boost_clock_ghz, tdp_watt) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'cpu-intel-i9-14900k'), 'LGA1700', 24, 32, 3.20, 6.00, 253),
    ((SELECT id FROM hardware WHERE hardware_key = 'cpu-amd-7800x3d'), 'AM5', 8, 16, 4.20, 5.00, 120);

INSERT INTO gpu_spec (hardware_id, chipset, vram_gb, vram_type, length_mm, tdp_watt) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'gpu-nvidia-rtx5090'), 'GB202', 32, 'GDDR7', 304, 575),
    ((SELECT id FROM hardware WHERE hardware_key = 'gpu-nvidia-rtx5080'), 'GB203', 16, 'GDDR7', 304, 360),
    ((SELECT id FROM hardware WHERE hardware_key = 'gpu-amd-rx8900xt'), 'Navi 48', 24, 'GDDR6', 330, 355),
    ((SELECT id FROM hardware WHERE hardware_key = 'gpu-nvidia-rtx5070'), 'GB205', 12, 'GDDR7', 242, 250);

INSERT INTO motherboard_spec (hardware_id, socket, ram_type, form_factor, memory_slots, max_memory_gb, pcie_version) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'motherboard-z790-lab'), 'LGA1700', 'DDR5', 'ATX', 4, 192, 'PCIe 5.0'),
    ((SELECT id FROM hardware WHERE hardware_key = 'motherboard-b650-lab'), 'AM5', 'DDR5', 'Micro-ATX', 4, 192, 'PCIe 4.0'),
    ((SELECT id FROM hardware WHERE hardware_key = 'motherboard-b760-d4-lab'), 'LGA1700', 'DDR4', 'Micro-ATX', 4, 128, 'PCIe 4.0');

INSERT INTO memory_spec (hardware_id, capacity_gb, generation, frequency_mhz, module_count, latency) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'ram-ddr5-64gb'), 64, 'DDR5', 6800, 2, 'CL34'),
    ((SELECT id FROM hardware WHERE hardware_key = 'ram-ddr5-32gb'), 32, 'DDR5', 6000, 2, 'CL30'),
    ((SELECT id FROM hardware WHERE hardware_key = 'ram-ddr4-32gb'), 32, 'DDR4', 3600, 2, 'CL18');

INSERT INTO storage_spec (hardware_id, storage_type, capacity_gb, interface_type, read_speed_mbps, write_speed_mbps) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'storage-nvme-4tb'), 'NVME', 4096, 'PCIe 5.0', 12000, 11000),
    ((SELECT id FROM hardware WHERE hardware_key = 'storage-nvme-1tb'), 'NVME', 1024, 'PCIe 4.0', 7000, 6000);

INSERT INTO cooling_spec (hardware_id, cooling_type, max_tdp_watt, radiator_size_mm, supported_sockets) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'cooling-tower-160'), 'AIR', 160, 0, JSON_ARRAY('LGA1700', 'AM5')),
    ((SELECT id FROM hardware WHERE hardware_key = 'cooling-aio-240'), 'AIO', 220, 240, JSON_ARRAY('LGA1700', 'AM5')),
    ((SELECT id FROM hardware WHERE hardware_key = 'cooling-aio-360'), 'AIO', 320, 360, JSON_ARRAY('LGA1700', 'AM5'));

INSERT INTO psu_spec (hardware_id, wattage, certification, modular_type) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'psu-850w-gold'), 850, 'Gold', 'FULL'),
    ((SELECT id FROM hardware WHERE hardware_key = 'psu-1000w-platinum'), 1000, 'Platinum', 'FULL'),
    ((SELECT id FROM hardware WHERE hardware_key = 'psu-1200w-platinum'), 1200, 'Platinum', 'FULL');

INSERT INTO case_spec (hardware_id, gpu_max_length_mm, motherboard_sizes, radiator_max_size_mm, cooler_max_height_mm) VALUES
    ((SELECT id FROM hardware WHERE hardware_key = 'case-future-glass'), 360, JSON_ARRAY('ATX', 'Micro-ATX'), 360, 185),
    ((SELECT id FROM hardware WHERE hardware_key = 'case-compact-lab'), 300, JSON_ARRAY('Micro-ATX'), 240, 160);

INSERT INTO hardware_model (
    hardware_id, name, glb_url, texture_url, preview_url,
    scale_x, scale_y, scale_z, position_x, position_y, position_z,
    rotation_x, rotation_y, rotation_z, lod_level, file_size_bytes,
    checksum_sha256, is_primary, status
)
SELECT
    id,
    CONCAT(name, ' Primary'),
    model_url,
    '',
    cover_url,
    1.00000,
    1.00000,
    1.00000,
    0.00000,
    0.00000,
    0.00000,
    0.00000,
    0.00000,
    0.00000,
    0,
    0,
    '',
    1,
    'READY'
FROM hardware;

INSERT INTO product_price (
    hardware_id, source, seller, price, currency, in_stock, product_url, checked_at
)
SELECT
    id,
    'INTERNAL',
    'PC LAB',
    base_price,
    'CNY',
    1,
    '',
    CURRENT_TIMESTAMP(3)
FROM hardware;
