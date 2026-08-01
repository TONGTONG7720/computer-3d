"use client";

import { ArrowLeft, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import styles from "./AiAdminAccessGate.module.css";

type AiAdminAccessGateProps = {
  readonly adminKey: string;
  readonly onAdminKeyChange: (value: string) => void;
  readonly onUnlock: (event: FormEvent<HTMLFormElement>) => void;
};

export function AiAdminAccessGate({
  adminKey,
  onAdminKeyChange,
  onUnlock,
}: AiAdminAccessGateProps) {
  return (
    <main className={styles["accessPage"]}>
      <div aria-hidden="true" className={styles["accessGrid"]} />
      <Link className={styles["backLink"]} href="/">
        <ArrowLeft size={15} />
        返回 3D Builder
      </Link>
      <section className={styles["accessCard"]}>
        <div className={styles["accessSignal"]}>
          <Sparkles size={20} />
          <i />
        </div>
        <small>PC LAB / INTELLIGENCE OPERATIONS</small>
        <h1>AI 控制平面</h1>
        <p>管理提示词版本、审核知识、推荐规则与隐私化请求遥测。</p>
        <form onSubmit={onUnlock}>
          <label>
            <span>Admin Key</span>
            <div>
              <KeyRound size={15} />
              <input
                autoComplete="current-password"
                name="admin-key"
                onChange={(event) => onAdminKeyChange(event.target.value)}
                required
                type="password"
                value={adminKey}
              />
            </div>
          </label>
          <button type="submit">
            <ShieldCheck size={16} />
            建立安全会话
          </button>
        </form>
        <em>密钥仅保存在当前浏览器会话；原始用户消息不会进入运营日志。</em>
      </section>
    </main>
  );
}
