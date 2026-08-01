"use client";

import { Database, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import styles from "./HardwareAdmin.module.css";

type AdminHardwareAccessProps = {
  readonly adminKey: string;
  readonly onAdminKeyChange: (value: string) => void;
  readonly onUnlock: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminHardwareAccess({
  adminKey,
  onAdminKeyChange,
  onUnlock,
}: AdminHardwareAccessProps) {
  return (
    <main className={styles["access"]} data-ui-version="v3">
      <Link href="/hardware">← 返回 Hardware Explorer</Link>
      <section>
        <span className={styles["accessIcon"]}>
          <Database size={22} />
        </span>
        <small>PC LAB OPERATIONS</small>
        <h1>硬件数据控制台</h1>
        <p>维护硬件身份、分类规格、性能档案、GLB 资源与兼容规则。</p>
        <form onSubmit={onUnlock}>
          <label>
            <span>
              <KeyRound size={13} /> Admin Key
            </span>
            <input
              aria-label="Admin Key"
              autoComplete="current-password"
              onChange={(event) => onAdminKeyChange(event.target.value)}
              required
              type="password"
              value={adminKey}
            />
          </label>
          <button type="submit">
            <ShieldCheck size={15} />
            进入控制台
          </button>
        </form>
        <small>密钥仅保存在当前浏览器会话，不写入 URL 或长期存储。</small>
      </section>
    </main>
  );
}
