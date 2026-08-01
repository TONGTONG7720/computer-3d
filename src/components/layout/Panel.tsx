import type { ReactNode } from "react";
import styles from "./Panel.module.css";

type PanelProps = {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly label: string;
  readonly region: "components" | "summary";
};

export function Panel({ children, className, label, region }: PanelProps) {
  const panelClassName =
    className === undefined ? styles["panel"] : `${styles["panel"]} ${className}`;

  return (
    <aside aria-label={label} className={panelClassName} data-panel-region={region}>
      {children}
    </aside>
  );
}
