"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBuilderStore } from "@/store/builderStore";
import { saveBuildToPlatform } from "../api/BuildApiClient";
import { createBuildConfig, saveBuildConfig } from "../domain/BuildStorage";
import styles from "./BuilderDialogs.module.css";

type SaveBuildDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

type SaveStatus = "idle" | "saving" | "synced" | "remote-only" | "local" | "error";

export function SaveBuildDialog({ open, onClose }: SaveBuildDialogProps) {
  const selectedComponents = useBuilderStore((state) => state.selectedComponents);
  const totalPrice = useBuilderStore((state) => state.totalPrice);
  const performance = useBuilderStore((state) => state.performanceScore);
  const catalogueStatus = useBuilderStore((state) => state.catalogueStatus);
  const [name, setName] = useState("我的电竞主机");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    if (open) {
      setSaveStatus("idle");
    }
  }, [open]);

  const saveLocalCopy = (id: string, trimmedName: string): boolean => {
    try {
      const config = createBuildConfig({
        id,
        name: trimmedName,
        createdAt: new Date().toISOString(),
        components: selectedComponents,
        price: totalPrice,
        performance,
      });
      saveBuildConfig(window.localStorage, config);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async (): Promise<void> => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || catalogueStatus !== "ready") {
      return;
    }
    setSaveStatus("saving");
    try {
      const remoteBuild = await saveBuildToPlatform(trimmedName, selectedComponents);
      const localSaved = saveLocalCopy(remoteBuild.publicId, trimmedName);
      setSaveStatus(localSaved ? "synced" : "remote-only");
    } catch {
      const localSaved = saveLocalCopy(window.crypto.randomUUID(), trimmedName);
      setSaveStatus(localSaved ? "local" : "error");
    }
  };

  const statusMessage = {
    idle: null,
    saving: "正在同步到 PC LAB 硬件数据中心…",
    synced: "配置已保存到后端，并保留本地副本。",
    "remote-only": "配置已保存到后端，本地副本写入失败。",
    local: "后端暂时不可用，配置已安全保存到当前浏览器。",
    error: "配置保存失败，请检查浏览器存储与后端服务。",
  }[saveStatus];

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className={styles["backdrop"]}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.section
            aria-labelledby="save-build-title"
            aria-modal="true"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`${styles["dialog"]} ${styles["compactDialog"]}`}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className={styles["header"]}>
              <div>
                <p>SYNC CONFIG</p>
                <h2 id="save-build-title">Save your machine</h2>
                <span>方案会同步到硬件数据中心，并在浏览器保留离线副本。</span>
              </div>
              <button
                aria-label="关闭保存配置"
                className={styles["closeButton"]}
                onClick={onClose}
                type="button"
              >
                <X size={17} />
              </button>
            </header>

            <label className={styles["field"]}>
              <span className={styles["fieldLabel"]}>BUILD NAME</span>
              <input
                className={styles["input"]}
                maxLength={60}
                onChange={(event) => setName(event.currentTarget.value)}
                value={name}
              />
            </label>

            {statusMessage !== null ? (
              <p aria-live="polite" className={styles["savedMessage"]} data-status={saveStatus}>
                {statusMessage}
              </p>
            ) : null}

            <footer className={styles["actions"]}>
              <button className={styles["secondaryButton"]} onClick={onClose} type="button">
                CLOSE
              </button>
              <motion.button
                className={styles["primaryButton"]}
                disabled={
                  name.trim().length === 0 || catalogueStatus !== "ready" || saveStatus === "saving"
                }
                onClick={() => {
                  void handleSave();
                }}
                type="button"
                whileTap={{ scale: 0.97 }}
              >
                <Save size={15} />
                {saveStatus === "saving" ? "SAVING…" : "SAVE BUILD"}
              </motion.button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
