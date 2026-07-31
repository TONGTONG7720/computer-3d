"use client";

import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import styles from "./AdminAccess.module.css";
import controls from "./AdminControls.module.css";

type AdminAccessGateProps = {
  readonly adminKey: string;
  readonly onAdminKeyChange: (value: string) => void;
  readonly onUnlock: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminAccessGate({ adminKey, onAdminKeyChange, onUnlock }: AdminAccessGateProps) {
  return (
    <main className={styles["accessPage"]}>
      <div aria-hidden="true" className={styles["accessAtmosphere"]} />
      <Link className={styles["backLink"]} href="/">
        <ArrowLeft size={16} />
        返回 3D Builder
      </Link>
      <section className={styles["accessCard"]}>
        <div className={styles["accessIcon"]}>
          <KeyRound size={24} strokeWidth={1.5} />
        </div>
        <span className={controls["eyebrow"]}>PC LAB OPERATIONS</span>
        <h1>价格情报控制台</h1>
        <p>
          连接人工商品库，维护平台报价与<span className={controls["nowrap"]}>价格趋势</span>。
        </p>
        <form onSubmit={onUnlock}>
          <label className={controls["field"]}>
            <span>Admin Key</span>
            <input
              autoComplete="current-password"
              name="admin-key"
              required
              type="password"
              value={adminKey}
              onChange={(event) => onAdminKeyChange(event.target.value)}
            />
          </label>
          <button className={controls["primaryButton"]} type="submit">
            <ShieldCheck size={16} />
            进入控制台
          </button>
        </form>
        <small>密钥仅保存在当前浏览器会话，不写入 URL 或长期存储。</small>
      </section>
    </main>
  );
}
