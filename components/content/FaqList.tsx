import { JsonLd } from "@/components/JsonLd";

type Faq = { question: string; answer: string };

export function FaqList({ items }: { items: Faq[] }) {
  if (items.length === 0) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <section className="section-space bg-[#f7f8f5]">
      <JsonLd data={schema} />
      <div className="container-shell">
        <p className="eyebrow">Câu hỏi thường gặp</p>
        <h2 className="mt-4 text-3xl font-extrabold text-forest-950 sm:text-4xl">Thông tin cần biết trước khi đặt hàng</h2>
        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <details key={item.question} className="group border border-forest-900/10 bg-white px-6 shadow-sm open:border-wood-500/40">
              <summary className="flex min-h-16 cursor-pointer list-none items-center pr-8 font-extrabold text-forest-950 marker:content-none">{item.question}</summary>
              <p className="pb-6 text-sm leading-7 text-slate-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
