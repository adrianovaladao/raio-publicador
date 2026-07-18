"use client";
import { useEffect } from "react";

export default function BlurOnBack() {
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) (document.activeElement as HTMLElement | null)?.blur();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);
  return null;
}
