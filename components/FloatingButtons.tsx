"use client";

import { ClipboardList, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

export function FloatingButtons() {
  const { lang } = useLang();
  const t = translations[lang];
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("trang-chu");
    if (!hero) {
      setShowQuote(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setShowQuote(!entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      <a
        href="#bao-gia"
        aria-hidden={!showQuote}
        className={[
          "hidden min-h-[52px] items-center gap-2 bg-wood-500 px-4 text-sm font-bold text-white shadow-md sm:flex",
          "transition-all duration-300",
          showQuote ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-3 opacity-0"
        ].join(" ")}
      >
        <ClipboardList size={17} /> {t.floatingQuote}
      </a>
      <a
        href="https://zalo.me/0909259160"
        target="_blank"
        rel="noreferrer"
        aria-label="Mở Zalo Tùng Phát"
        className="grid h-[62px] w-[62px] place-items-center rounded-full bg-[#0068ff] font-extrabold text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-transform hover:scale-[1.06]"
        style={{ fontSize: 15 }}
      >
        Zalo
      </a>
      <a
        href="tel:0909259160"
        aria-label="Gọi Tùng Phát"
        className="grid h-[52px] w-[52px] place-items-center rounded-full bg-wood-500 text-white shadow-md sm:hidden"
      >
        <Phone size={20} />
      </a>
    </div>
  );
}
