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

    if (!element) {
      setReplayKey(1);
      return;
    }

    let activated = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || activated) return;
      activated = true;
      setReplayKey(1);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className={className} data-hero-pen-logo>
      <LogoAnimationSpeedContext value={1.6}>
        <AnimatedLogo autoplay={false} replayKey={replayKey} variant="pen" />
      </LogoAnimationSpeedContext>
    </div>
  );
}
