import { useEffect, useRef } from "react";

export function ConfirmDialog({ open, title, description, onConfirm, onClose }: { open: boolean; title: string; description: string; onConfirm: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open && !dialog.current?.open) dialog.current?.showModal(); if (!open && dialog.current?.open) dialog.current.close(); }, [open]);
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose}><h2>{title}</h2><p>{description}</p><div className="dialog-actions"><button onClick={onClose}>Hủy</button><button className="primary" onClick={onConfirm}>Xác nhận</button></div></dialog>;
}
