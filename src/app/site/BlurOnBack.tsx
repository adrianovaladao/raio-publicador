"use client";
import { useEffect } from "react";

declare global { interface Window { __isBackNav?: boolean } }

export default function BlurOnBack() {
  useEffect(() => {
    const handleBack = () => {
      window.__isBackNav = true;
      setTimeout(() => { window.__isBackNav = false; }, 1000);
      (document.activeElement as HTMLElement | null)?.blur();
    };
    window.addEventListener("pageshow", handleBack);
    window.addEventListener("popstate", handleBack);
    return () => {
      window.removeEventListener("pageshow", handleBack);
      window.removeEventListener("popstate", handleBack);
    };
  }, []);
  return null;
}
