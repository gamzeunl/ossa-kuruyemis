"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Kart gruplarında hafif "stagger" hissi için (ör. `index * 60`) — ms cinsinden. */
  delayMs?: number;
}

/**
 * Ana sayfa için TEK hafif "scroll reveal" — Framer Motion/GSAP YOK, yalnızca
 * `IntersectionObserver` + CSS transition (opacity/translateY, ~400ms).
 * `prefers-reduced-motion` aktifse `globals.css`'teki genel kural
 * (`transition-duration: 0.01ms !important`) geçişi zaten neredeyse anında
 * hâle getirir — burada ayrıca bir dallanma YOK, tek global mekanizma yeterli.
 * `IntersectionObserver` yoksa (eski tarayıcı) içerik doğrudan görünür render edilir.
 */
export function ScrollReveal({ children, className = "", delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`transition-all duration-[420ms] ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
