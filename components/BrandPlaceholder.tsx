import { ImageIcon } from "lucide-react";

type BrandPlaceholderProps = {
  label: string;
  className?: string;
};

export function BrandPlaceholder({ label, className = "" }: BrandPlaceholderProps) {
  return (
    <div
      className={`grid place-items-center bg-[#eef1ed] text-forest-900 ${className}`}
      role="img"
      aria-label={`Vị trí hình ảnh ${label}`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <ImageIcon aria-hidden="true" size={28} strokeWidth={1.6} />
        <span className="text-xs font-bold">Hình ảnh đang cập nhật</span>
      </div>
    </div>
  );
}
