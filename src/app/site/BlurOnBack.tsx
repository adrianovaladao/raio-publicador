"use client";
import { useEffect } from "react";

export default function BlurOnBack() {
  useEffect(() => {
    const handleBack = () => {
      // Immediately reveal all animated elements — skip animation on back navigation
      document.querySelectorAll<HTMLElement>(".reveal").forEach(el => {
        el.style.transition = "none";
        el.classList.add("in");
      });
      // Blur any focused element
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
