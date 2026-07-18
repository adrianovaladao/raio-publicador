"use client";
import { useEffect } from "react";

export default function BlurOnBack() {
  useEffect(() => {
    const blurActive = () => {
      // Delay to fire after Next.js / browser focus restoration
      setTimeout(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        document.body.focus();
      }, 100);
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
