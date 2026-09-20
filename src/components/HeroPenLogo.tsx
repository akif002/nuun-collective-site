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
    let frame = 0;

    // A tall logo can touch a central observer band well before it is actually visible.
    // Trigger only once the wordmark's own centre is within a tight band around the viewport centre.
    const checkPosition = () => {
      frame = 0;
      if (activated) return;

      const bounds = element.getBoundingClientRect();
      const viewportCentre = window.innerHeight / 2;
      const logoCentre = bounds.top + bounds.height / 2;
      const activationBand = Math.max(40, Math.min(96, bounds.height * 0.18));

      if (Math.abs(logoCentre - viewportCentre) <= activationBand) {
        activated = true;
        setReplayKey(1);
        window.removeEventListener("scroll", requestCheck);
        window.removeEventListener("resize", requestCheck);
      }
    };

    const requestCheck = () => {
      if (!frame) frame = window.requestAnimationFrame(checkPosition);
    };

    window.addEventListener("scroll", requestCheck, { passive: true });
    window.addEventListener("resize", requestCheck);
    requestCheck();

    return () => {
      window.removeEventListener("scroll", requestCheck);
      window.removeEventListener("resize", requestCheck);
      if (frame) window.cancelAnimationFrame(frame);
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
