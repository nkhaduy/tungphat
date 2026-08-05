export function PageContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`container-shell ${className}`}>{children}</div>;
}
