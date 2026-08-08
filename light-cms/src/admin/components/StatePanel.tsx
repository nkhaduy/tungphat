export function StatePanel({ title, description, tone = "neutral" }: { title: string; description: string; tone?: "neutral" | "error" | "success" }) {
  return <section className={`state-panel ${tone}`} role={tone === "error" ? "alert" : "status"}><strong>{title}</strong><p>{description}</p></section>;
}
