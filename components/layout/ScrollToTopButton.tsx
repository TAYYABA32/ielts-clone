"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 400;

/** Appears once the page has been scrolled down a bit; scrolls smoothly back to top on click. */
export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > SHOW_AFTER_PX);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-56 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[#1b2a4a] p-0 text-white shadow-lg hover:bg-[#14213a]"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
