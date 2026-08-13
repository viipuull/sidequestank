import { useEffect } from "react";

/**
 * Global tactile click feedback: paints a short-lived ripple at the pointer
 * position for any interactive element (buttons, links, cards, tabs).
 */
export function TapFeedback() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.(
        'button, a, [role="button"], [role="tab"], [data-tap], summary, label[for]',
      ) as HTMLElement | null;
      if (!el || el.hasAttribute("disabled") || el.dataset["noTap"] !== undefined) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height) * 1.15;
      ripple.className = "sq-ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      const computed = getComputedStyle(el);
      if (computed.position === "static") el.style.position = "relative";
      if (computed.overflow === "visible") el.style.overflow = "hidden";

      el.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 520);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
