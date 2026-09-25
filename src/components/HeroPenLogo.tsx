import { useEffect, useRef, useState } from "react";
import AnimatedLogo from "./AnimatedLogo";

type HeroPenLogoProps = {
  className?: string;
};

export default function HeroPenLogo({ className }: HeroPenLogoProps) {
  const [progress, setProgress] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = rootRef.current?.closest(".hero");
    if (!section) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      // Use most of a viewport of travel, so short scroll gestures make
      // small changes and the wordmark completes while the hero is visible.
      const next = Math.min(1, Math.max(0, (viewportHeight * 0.9 - section.getBoundingClientRect().top) / (viewportHeight * 0.82)));
      setProgress((current) => Math.abs(current - next) > 0.002 ? next : current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={className} data-hero-pen-logo>
      <AnimatedLogo autoplay={false} variant="pen" scrollProgress={progress} />
    </div>
  );
}
