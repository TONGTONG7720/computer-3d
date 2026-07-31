import { Save, Trash2 } from "lucide-react";
import controls from "./AdminControls.module.css";
import styles from "./ProductEditor.module.css";

type ProductEditorActionsProps = {
  readonly editing: boolean;
  readonly onRemove: () => void;
  readonly saving: boolean;
};

export function ProductEditorActions({ editing, onRemove, saving }: ProductEditorActionsProps) {
  return (
    <div className={styles["editorActions"]}>
      {editing ? (
        <button
          className={controls["dangerButton"]}
          disabled={saving}
          onClick={onRemove}
          type="button"
        >
          <Trash2 size={15} />
          停用商品
        </button>
      ) : null}
      <button className={controls["primaryButton"]} disabled={saving} type="submit">
        <Save size={16} />
        {saving ? "正在保存" : editing ? "保存商品" : "创建商品"}
      </button>
    </div>
  );
}
