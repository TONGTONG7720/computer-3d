"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { type MouseEvent, type ReactNode, useId, useRef } from "react";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import styles from "./BottomSheet.module.css";

type BottomSheetProps = {
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly open: boolean;
  readonly side: "left" | "right";
  readonly size?: "content" | "full";
  readonly title: string;
};

export function BottomSheet({
  children,
  onClose,
  open,
  side,
  size = "content",
  title,
}: BottomSheetProps) {
  const titleId = useId();
  const isolationRootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useDialogFocus({
    dialogRef,
    initialFocusRef: closeButtonRef,
    isolationRootRef,
    onClose,
    open,
  });

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className={styles["backdrop"]}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={titleId}
          onMouseDown={closeFromBackdrop}
          ref={isolationRootRef}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <motion.aside
            animate={{ opacity: 1, x: 0, y: 0 }}
            aria-labelledby={titleId}
            aria-modal="true"
            className={styles["sheet"]}
            data-side={side}
            data-size={size}
            exit={{ opacity: 0, x: "var(--sheet-enter-x)", y: "var(--sheet-enter-y)" }}
            initial={{ opacity: 0, x: "var(--sheet-enter-x)", y: "var(--sheet-enter-y)" }}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <header className={styles["header"]}>
              <span aria-hidden="true" className={styles["handle"]} />
              <h2 id={titleId}>{title}</h2>
              <button
                aria-label={`关闭${title}`}
                onClick={onClose}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" size={18} strokeWidth={1.7} />
              </button>
            </header>
            <div className={styles["content"]}>{children}</div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
