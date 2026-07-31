"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBuilderStore } from "@/store/builderStore";
import { createBuildConfig, saveBuildConfig } from "../domain/BuildStorage";
import styles from "./BuilderDialogs.module.css";

type SaveBuildDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

export function SaveBuildDialog({ open, onClose }: SaveBuildDialogProps) {
  const selectedComponents = useBuilderStore((state) => state.selectedComponents);
  const totalPrice = useBuilderStore((state) => state.totalPrice);
  const performance = useBuilderStore((state) => state.performanceScore);
  const [name, setName] = useState("我的电竞主机");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSaved(false);
    }
  }, [open]);

  const handleSave = (): void => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return;
    }
    const config = createBuildConfig({
      id: window.crypto.randomUUID(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
      components: selectedComponents,
      price: totalPrice,
      performance,
    });
    saveBuildConfig(window.localStorage, config);
    setSaved(true);
  };

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
                <p>LOCAL CONFIG</p>
                <h2 id="save-build-title">Save your machine</h2>
                <span>方案会保存到当前浏览器，不会上传账户或商城。</span>
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

            {saved ? (
              <p aria-live="polite" className={styles["savedMessage"]}>
                配置已保存到 LocalStorage。
              </p>
            ) : null}

            <footer className={styles["actions"]}>
              <button className={styles["secondaryButton"]} onClick={onClose} type="button">
                CLOSE
              </button>
              <motion.button
                className={styles["primaryButton"]}
                disabled={name.trim().length === 0}
                onClick={handleSave}
                type="button"
                whileTap={{ scale: 0.97 }}
              >
                <Save size={15} />
                SAVE BUILD
              </motion.button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
