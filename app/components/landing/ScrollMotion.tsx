"use client";

import { useEffect } from "react";

/**
 * Animates every [data-anim] element on the landing page in as it scrolls into view and back out as
 * it leaves, from whichever edge it left by (styles in app/styles/glass.css).
 *
 * - [data-anim-stagger="80"] on a parent staggers its [data-anim] children by 80ms each.
 * - Elements already on screen at mount are marked "in" before motion is switched on, so nothing
 *   that's visible flashes out and back.
 * - Off under prefers-reduced-motion: content simply stays visible.
 */
export default function ScrollMotion({ root = ".ch-home" }: { root?: string }) {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(root);
    if (!host || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    host.querySelectorAll<HTMLElement>("[data-anim-stagger]").forEach((parent) => {
      const step = Number(parent.dataset.animStagger) || 80;
      parent.querySelectorAll<HTMLElement>(":scope > [data-anim], :scope > * > [data-anim]").forEach((el, i) => {
        if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", `${i * step}ms`);
      });
    });

    const els = Array.from(host.querySelectorAll<HTMLElement>("[data-anim]"));
    const vh = window.innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        el.dataset.in = "true";
        el.dataset.settled = "";
      } else {
        el.dataset.pos = r.top >= vh ? "below" : "above";
      }
    }
    host.classList.add("ch-motion");

    // Once the entrance transition finishes, drop the stagger delay so hovers feel instant.
    const onEnd = (e: TransitionEvent) => {
      const el = e.target as HTMLElement;
      if (e.propertyName === "opacity" && el.dataset.in === "true") el.dataset.settled = "";
    };
    host.addEventListener("transitionend", onEnd);

    const io = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting, boundingClientRect } of entries) {
          const el = target as HTMLElement;
          if (isIntersecting) {
            el.dataset.in = "true";
          } else {
            el.dataset.in = "false";
            el.dataset.pos = boundingClientRect.top < 0 ? "above" : "below";
            delete el.dataset.settled;
          }
        }
      },
      // Trigger a little inside the viewport edges so items animate where you can see them.
      { rootMargin: "-6% 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      host.removeEventListener("transitionend", onEnd);
      host.classList.remove("ch-motion");
    };
  }, [root]);

  return null;
}
