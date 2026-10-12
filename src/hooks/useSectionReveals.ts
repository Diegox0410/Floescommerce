import { useEffect, useRef } from "react";

/** Progressive, once-only reveal for homepage chapters and their marked story elements. */
export function useSectionReveals<T extends HTMLElement>() {
  const rootRef = useRef<T | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const observed = new Set<HTMLElement>();
    const parallaxElements = new Set<HTMLElement>();
    let parallaxFrame = 0;

    const updateParallax = () => {
      parallaxFrame = 0;
      const viewportHeight = window.innerHeight || 1;
      for (const element of parallaxElements) {
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > viewportHeight) continue;
        const centerOffset = (viewportHeight / 2 - (bounds.top + bounds.height / 2)) / viewportHeight;
        const translateY = Math.max(-9, Math.min(9, centerOffset * 18));
        element.style.setProperty("--floes-parallax-y", `${translateY.toFixed(2)}px`);
      }
    };

    const scheduleParallax = () => {
      if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target as HTMLElement;
        section.dataset.scrollReveal = "visible";
        observer.unobserve(section);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    const observeSections = () => {
      root.querySelectorAll<HTMLElement>(":scope > section:not(.floes-hero), :scope > section:not(.floes-hero) [data-scroll-item]").forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.dataset.scrollReveal = "pending";
        observer.observe(element);
      });

      root.querySelectorAll<HTMLElement>("[data-scroll-parallax]").forEach((element) => {
        if (parallaxElements.has(element)) return;
        parallaxElements.add(element);
        element.style.setProperty("--floes-parallax-y", "0px");
      });
      scheduleParallax();
    };

    observeSections();
    root.dataset.scrollRevealReady = "true";

    // Some data-driven sections appear after the catalog finishes loading.
    const mutations = new MutationObserver(observeSections);
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax, { passive: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener("scroll", scheduleParallax);
      window.removeEventListener("resize", scheduleParallax);
      if (parallaxFrame) window.cancelAnimationFrame(parallaxFrame);
      delete root.dataset.scrollRevealReady;
      observed.forEach((section) => delete section.dataset.scrollReveal);
      parallaxElements.forEach((element) => element.style.removeProperty("--floes-parallax-y"));
    };
  }, []);

  return rootRef;
}
