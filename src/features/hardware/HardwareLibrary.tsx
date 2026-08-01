"use client";

import { AlertTriangle, LoaderCircle, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type CompatibilityResult,
  evaluateCompatibility,
} from "@/features/builder/domain/CompatibilityEngine";
import {
  type Hardware,
  type HardwareCategory,
  hardwareCategories,
  replaceSelectedHardware,
  type SelectedComponents,
} from "@/features/builder/domain/hardware";
import { useBuilderWorkspaceStore } from "@/features/builder/store/BuilderStoreProvider";
import { ComponentSlotRail } from "./ComponentSlotRail";
import { HardwareItem } from "./HardwareItem";
import styles from "./HardwareLibrary.module.css";
import { hardwareCategoryCodes, hardwareCategoryLabels } from "./hardwarePresentation";

const findOptionIssue = (
  hardware: Hardware,
  selection: SelectedComponents,
): CompatibilityResult | null => {
  const candidate = replaceSelectedHardware(selection, hardware);
  const result = evaluateCompatibility(candidate).results.find(
    (entry) => entry.status !== "success" && entry.components.includes(hardware.id),
  );
  return result ?? null;
};

const matchesSearch = (hardware: Hardware, query: string): boolean => {
  if (query.length === 0) {
    return true;
  }
  const searchable =
    `${hardware.brand} ${hardware.name} ${hardware.modelVariant}`.toLocaleLowerCase("zh-CN");
  return searchable.includes(query);
};

export function HardwareLibrary() {
  const catalogue = useBuilderWorkspaceStore((state) => state.catalogue);
  const catalogueStatus = useBuilderWorkspaceStore((state) => state.catalogueStatus);
  const catalogueError = useBuilderWorkspaceStore((state) => state.catalogueError);
  const retryCatalogue = useBuilderWorkspaceStore((state) => state.retryCatalogue);
  const activeCategory = useBuilderWorkspaceStore((state) => state.activeCategory);
  const selectedComponents = useBuilderWorkspaceStore((state) => state.selectedComponents);
  const selectHardware = useBuilderWorkspaceStore((state) => state.selectHardware);
  const setActiveCategory = useBuilderWorkspaceStore((state) => state.setActiveCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("zh-CN");
  const installedCount = hardwareCategories.filter(
    (category) => selectedComponents[category] !== null,
  ).length;
  const options = useMemo(
    () =>
      catalogue.filter(
        (hardware) =>
          hardware.category === activeCategory && matchesSearch(hardware, normalizedQuery),
      ),
    [activeCategory, catalogue, normalizedQuery],
  );

  const selectCategory = (category: HardwareCategory): void => {
    setSearchQuery("");
    setActiveCategory(category);
  };

  return (
    <div className={styles["library"]}>
      <div className={styles["panelHeader"]}>
        <span>
          <small>COMPONENTS</small>
          <strong>硬件组件</strong>
        </span>
        <span data-numeric="true">{installedCount} / 8 已安装</span>
      </div>

      <label className={styles["search"]}>
        <Search aria-hidden="true" size={16} strokeWidth={1.6} />
        <input
          aria-label={`搜索 ${hardwareCategoryCodes[activeCategory]}`}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={`搜索 ${hardwareCategoryLabels[activeCategory]}型号`}
          type="search"
          value={searchQuery}
        />
        {searchQuery.length > 0 ? (
          <button aria-label="清空搜索关键词" onClick={() => setSearchQuery("")} type="button">
            <X aria-hidden="true" size={14} strokeWidth={1.8} />
          </button>
        ) : null}
      </label>

      <ComponentSlotRail
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
        selectedComponents={selectedComponents}
      />

      <div className={styles["optionsHeader"]}>
        <span>
          <small>OPTIONS</small>
          <strong>{hardwareCategoryLabels[activeCategory]}</strong>
        </span>
        <span>
          {options.length} 项
          <SlidersHorizontal aria-hidden="true" size={14} strokeWidth={1.6} />
        </span>
      </div>

      <ul
        aria-label={`${hardwareCategoryCodes[activeCategory]} 可选硬件`}
        className={styles["options"]}
      >
        {catalogueStatus === "idle" || catalogueStatus === "loading" ? (
          <li aria-live="polite" className={styles["state"]} role="status">
            <LoaderCircle aria-hidden="true" data-spin="true" size={20} strokeWidth={1.5} />
            <strong>正在连接硬件数据中心</strong>
            <span>加载规格、性能档案与 3D 模型绑定…</span>
          </li>
        ) : catalogueStatus === "error" ? (
          <li className={styles["state"]} data-state="error">
            <AlertTriangle aria-hidden="true" size={20} strokeWidth={1.5} />
            <strong>硬件目录加载失败</strong>
            <span>{catalogueError}</span>
            <button onClick={() => void retryCatalogue()} type="button">
              <RefreshCw aria-hidden="true" size={14} />
              重新连接
            </button>
          </li>
        ) : options.length > 0 ? (
          options.map((hardware) => {
            const installed = selectedComponents[hardware.category]?.id === hardware.id;
            const compatibility = findOptionIssue(hardware, selectedComponents);
            return (
              <li key={hardware.id}>
                <HardwareItem
                  compatibility={compatibility}
                  hardware={hardware}
                  installed={installed}
                  onSelect={selectHardware}
                />
              </li>
            );
          })
        ) : (
          <li className={styles["empty"]}>
            <Search aria-hidden="true" size={20} strokeWidth={1.5} />
            <strong>没有匹配的 {hardwareCategoryCodes[activeCategory]}</strong>
            <span>调整型号或品牌关键词。</span>
            <button onClick={() => setSearchQuery("")} type="button">
              清除搜索
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
