import { FileClock } from "lucide-react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="border border-dashed border-forest-900/20 bg-white p-7 text-center sm:p-10"><span className="mx-auto grid h-12 w-12 place-items-center bg-[#edf4ef] text-forest-900"><FileClock size={23} aria-hidden="true" /></span><h2 className="mt-5 text-xl font-extrabold text-forest-950">{title}</h2><p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-700">{description}</p>{action ? <div className="mt-6 flex justify-center">{action}</div> : null}</div>;
}
