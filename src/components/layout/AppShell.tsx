import type { ReactNode } from "react";
import styles from "./AppShell.module.css";
import { Panel } from "./Panel";

type AppShellProps = {
  readonly toolbar: ReactNode;
  readonly componentLibrary: ReactNode;
  readonly viewport: ReactNode;
  readonly buildPanel: ReactNode;
  readonly mobileControls?: ReactNode;
};

export function AppShell({
  buildPanel,
  componentLibrary,
  mobileControls,
  toolbar,
  viewport,
}: AppShellProps) {
  return (
    <div className={styles["shell"]} data-ui-version="v3">
      <a className={styles["skipLink"]} href="#builder-workspace">
        跳到配置工作区
      </a>
      <header className={styles["toolbar"]}>{toolbar}</header>
      <main aria-label="电脑配置工作台" className={styles["workspace"]} id="builder-workspace">
        <Panel className={styles["leftPanel"]} label="硬件组件库" region="components">
          {componentLibrary}
        </Panel>
        <section aria-label="3D 预览工作区" className={styles["viewport"]}>
          {viewport}
        </section>
        <Panel className={styles["rightPanel"]} label="配置分析面板" region="summary">
          {buildPanel}
        </Panel>
      </main>
      {mobileControls}
    </div>
  );
}
