"use client";

import { useEffect, useRef } from "react";

/**
 * Attaches a scroll-driven scale + opacity effect to an element.
 *
 * The section closest to the vertical center of the viewport renders
 * at maxScale / full opacity. Sections further from center shrink
 * toward minScale and fade slightly. Pure DOM style mutation via a
 * ref (no React re-renders), throttled with requestAnimationFrame,
 * so it stays smooth even on long pages.
 */
export function useScrollScale<T extends HTMLElement = HTMLDivElement>(
  minScale = 0.94,
  maxScale = 1
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    let ticking = false;

    function apply() {
      const el = ref.current;

      if (el) {
        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distance = Math.abs(elementCenter - viewportCenter);
        const maxDistance = Math.max(window.innerHeight * 0.8, 1);
        const proximity = Math.max(0, 1 - distance / maxDistance);
        const scale = minScale + proximity * (maxScale - minScale);

        el.style.transform = `scale(${scale.toFixed(3)})`;
        el.style.opacity = `${(0.78 + proximity * 0.22).toFixed(3)}`;
      }

      ticking = false;
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    apply();

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [minScale, maxScale]);

  return ref;
}