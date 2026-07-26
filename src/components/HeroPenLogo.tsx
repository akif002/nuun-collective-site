import { useEffect, useRef, useState } from "react";
import AnimatedLogo, { LogoAnimationSpeedContext } from "./AnimatedLogo";

type HeroPenLogoProps = {
  className?: string;
};

export default function HeroPenLogo({ className }: HeroPenLogoProps) {
  const [replayKey, setReplayKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rootRef.current;

    if (!element || !("IntersectionObserver" in window)) {
      setReplayKey(1);
      return;
    }

    // The contracted root margin creates a slim activation band at viewport centre.
    // The logo stays as a faint, ready-to-write silhouette until it enters that band.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReplayKey(1);
          observer.disconnect();
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={className} data-hero-pen-logo>
      <LogoAnimationSpeedContext value={1.6}>
        <AnimatedLogo autoplay={false} replayKey={replayKey} variant="pen" />
      </LogoAnimationSpeedContext>
    </div>
  );
}
