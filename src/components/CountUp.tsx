"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  to,
  suffix = "",
  className = "",
}: {
  to: number;
  suffix?: string;
  className?: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      raf = requestAnimationFrame(() => setVal(to));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const dur = 1200;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      setVal(Math.floor((1 - Math.pow(1 - k, 3)) * to));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString("vi-VN")}
      {suffix && <span className="text-[.5em] text-ash-dim ml-0.5">{suffix}</span>}
    </span>
  );
}
