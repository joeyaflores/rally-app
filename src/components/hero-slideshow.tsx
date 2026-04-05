"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import config from "@rally";

const IMAGES = config.heroImages;
const CYCLE_MS = 6000;

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % IMAGES.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <div className="absolute inset-0">
      {IMAGES.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          sizes="100vw"
          priority={i === 0}
          unoptimized
          style={{
            objectFit: "cover",
            objectPosition: img.position,
            opacity: i === active ? 1 : 0,
            transform: reducedMotion ? undefined : i === active ? "scale(1.04)" : "scale(1)",
            transition: reducedMotion
              ? "opacity 0.3s ease-in-out"
              : i === active
                ? "opacity 2s ease-in-out, transform 8s ease-out"
                : "opacity 2s ease-in-out, transform 0.3s ease-in",
          }}
        />
      ))}
    </div>
  );
}
