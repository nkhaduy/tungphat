import { useEffect, useState } from "react";
import { api } from "../api";
import { StatePanel } from "../components/StatePanel";
import { lightCmsUiCopy } from "../environment";

export function DataScreen({ kind }: { kind: "users" | "audit" }) {
  const [data, setData] = useState<unknown[] | null>(null); const [error, setError] = useState("");
  useEffect(() => { (kind === "users" ? api.users() : api.audit()).then(setData).catch((reason: Error) => setError(reason.message)); }, [kind]);
  if (error) return <StatePanel title="Không tải được dữ liệu" description={error} tone="error" />;
  if (!data) return <StatePanel title="Đang tải" description={lightCmsUiCopy.dataLoading} />;
  return <><header className="page-heading"><p className="eyebrow">VẬN HÀNH</p><h1>{kind === "users" ? "Người dùng" : "Nhật ký kiểm toán"}</h1><p>{kind === "users" ? "Vai trò được kiểm tra lại ở Worker cho mọi thao tác." : "Audit log chỉ được thêm mới qua API thông thường."}</p></header><section className="paper-section"><pre className="data-preview">{JSON.stringify(data, null, 2)}</pre></section></>;
}
