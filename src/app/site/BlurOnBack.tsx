"use client";
import { useEffect } from "react";

export default function BlurOnBack() {
  useEffect(() => {
    const blurActive = () => {
      // Run at 0, 100, and 300ms to catch both bfcache and Next.js router focus restore
      [0, 100, 300].forEach(delay =>
        setTimeout(() => {
          (document.activeElement as HTMLElement | null)?.blur();
          document.body.setAttribute("tabindex", "-1");
          document.body.focus();
          document.body.removeAttribute("tabindex");
        }, delay)
      );
    };
    window.addEventListener("pageshow", blurActive);
    window.addEventListener("popstate", blurActive);
    return () => {
      window.removeEventListener("pageshow", blurActive);
      window.removeEventListener("popstate", blurActive);
    };
  }, []);
  return null;
}
