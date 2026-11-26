"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./CncCarousel.module.css";

const slides = [
  ["cabinet-dimensions", "Bản vẽ kích thước các chi tiết tủ"],
  ["wardrobe-drawing", "Bản vẽ tủ áo với kích thước và các ngăn"],
  ["furniture-layout", "Bố trí các chi tiết nội thất dạng tấm"],
  ["decorative-panels", "Mẫu họa tiết vách trang trí cắt CNC"],
  ["bedroom-interior", "Không gian phòng ngủ với tủ và vách gỗ"],
  ["display-cabinet", "Tủ trưng bày với các ngăn và ánh sáng"],
] as const;

export function CncCarousel() {
  const [active, setActive] = useState(0);
  const startX = useRef<number | null>(null);
  const move = (step: number) => setActive((current) => (current + step + slides.length) % slides.length);
  return (
    <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Hình ảnh bản vẽ và nội thất CNC" tabIndex={0}
      onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      <div className={styles.stage} onPointerDown={(event) => { startX.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerCancel={() => { startX.current = null; }} onPointerUp={(event) => { if (startX.current !== null && Math.abs(event.clientX - startX.current) > 40) move(event.clientX < startX.current ? 1 : -1); startX.current = null; }}>
        {slides.map(([file, alt], index) => {
          let offset = (index - active + slides.length) % slides.length;
          if (offset > slides.length / 2) offset -= slides.length;
          if (Math.abs(offset) > 2) return null;
          const distance = Math.abs(offset);
          return <div key={file} className={styles.slide} aria-hidden={offset !== 0} style={{ transform: `translateX(calc(-50% + ${offset * 23}%)) translateZ(${-distance * 90}px) rotateY(${-offset * 9}deg) scale(${1 - distance * .1})`, zIndex: 3 - distance, opacity: 1 - distance * .24, filter: `blur(${distance * 1.2}px)` }}>
            <Image src={`/images/cnc/${file}.webp`} alt={offset === 0 ? alt : ""} fill sizes="(max-width: 768px) 75vw, 440px" className={styles.image} draggable={false} />
          </div>;
        })}
      </div>
      <div className={styles.controls}>
        <button type="button" aria-label="Ảnh CNC trước" onClick={() => move(-1)} className={styles.arrow}><ChevronLeft size={20} aria-hidden="true" /></button>
        <div className={styles.dots} aria-label="Chọn ảnh CNC">{slides.map(([, alt], index) => <button key={alt} type="button" aria-label={`Ảnh ${index + 1}: ${alt}`} aria-pressed={active === index} onClick={() => setActive(index)} className={styles.dot}><span /></button>)}</div>
        <button type="button" aria-label="Ảnh CNC tiếp theo" onClick={() => move(1)} className={styles.arrow}><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      <p className="sr-only" aria-live="polite">Ảnh {active + 1} / {slides.length}: {slides[active][1]}</p>
    </div>
  );
}
