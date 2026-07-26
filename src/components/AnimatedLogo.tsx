import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export type AnimatedLogoProps = {
  autoplay?: boolean;
  replayKey?: number;
  className?: string;
  onComplete?: () => void;
  variant?: LogoAnimationVariant;
};

export type LogoAnimationVariant = "liquid" | "editorial" | "ink" | "pen" | "typesetter" | "exposure";

export const logoAnimationConfig = {
  color: "#DE6E38",
  highlightColor: "#EF8A54",
  easing: [0.22, 1, 0.36, 1] as const,
  letterDuration: 0.3,
  letterStagger: 0.17,
  fillDelay: 0.02,
  highlightDelay: 0.68,
  highlightDuration: 0.32,
  highlightOpacity: 0.48,
  scaleDelay: 0.88,
  scaleDuration: 0.26,
  // Deliberately neutral: the finished logo holds still rather than bouncing.
  scaleAmount: 1,
  silhouetteOpacity: 0.1,
  waveStartY: 148,
  waveMiddleY: 72,
  waveEndY: -4,
  waveStartAmplitude: 0.9,
  waveMiddleAmplitude: 0.45,
  waveEndAmplitude: 0.1,
  liquidBottomY: 150,
  highlightWidth: 96,
  highlightStartX: -96,
  highlightEndX: 470,
  variantSettleDelays: {
    liquid: 0.88,
    editorial: 0.68,
    ink: 1.04,
    pen: 1.12,
    typesetter: 0.86,
    exposure: 0.72,
  },
  slowMotionMultiplier: 2.5,
};

export const LogoAnimationSpeedContext = createContext(1);

const logoPaths = [
  "M 23 124 V 59 C 23 34 41 18.5 63.5 18.5 C 86 18.5 104 36 104 59 V 124",
  "M 138 15 V 79 C 138 104 154 122.5 177 122.5 C 200 122.5 216 104 216 79 V 15",
  "M 253 15 V 79 C 253 104 269 122.5 292 122.5 C 315 122.5 331 104 331 79 V 15",
  "M 367 124 V 59 C 367 34 385 18.5 407.5 18.5 C 430 18.5 448 36 448 59 V 124",
];

function wavePath(top: number, amplitude: number) {
  const left = -10;
  const right = 480;
  const midpoint = 235;

  return `M ${left} ${top} C 80 ${top - amplitude}, 160 ${top + amplitude}, ${midpoint} ${top} C 310 ${top - amplitude}, 390 ${top + amplitude}, ${right} ${top} L ${right} ${logoAnimationConfig.liquidBottomY} L ${left} ${logoAnimationConfig.liquidBottomY} Z`;
}

export default function AnimatedLogo({
  autoplay = true,
  replayKey = 0,
  className,
  onComplete,
  variant = "liquid",
}: AnimatedLogoProps) {
  const speedMultiplier = useContext(LogoAnimationSpeedContext);
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const logoMaskId = `logo-mask-${uid}`;
  const letterMaskIds = logoPaths.map((_, index) => `logo-letter-mask-${index + 1}-${uid}`);
  const highlightId = `logo-highlight-${uid}`;
  const [run, setRun] = useState(autoplay ? 1 : 0);
  const firstReplayKey = useRef(replayKey);
  const previousAutoplay = useRef(autoplay);
  const isAnimated = run > 0 && !reducedMotion;
  const isWaiting = run === 0 && !reducedMotion;
  const isComplete = Boolean(reducedMotion);
  const settleDelay = logoAnimationConfig.variantSettleDelays[variant] * speedMultiplier;
  const letterCenters = [64, 177, 292, 408];

  useEffect(() => {
    if (replayKey !== firstReplayKey.current) {
      firstReplayKey.current = replayKey;
      setRun((current) => current + 1);
    }
  }, [replayKey]);

  useEffect(() => {
    if (autoplay && !previousAutoplay.current) {
      setRun((current) => current + 1);
    }
    previousAutoplay.current = autoplay;
  }, [autoplay]);

  return (
    <svg
      key={run}
      className={className}
      viewBox="0 0 470 140"
      role="img"
      aria-label="Animated logo"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
    >
      <defs>
        {/* The PNG reference uses a consistent monoline; masks preserve that exact smooth stroke geometry. */}
        <mask id={logoMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="470" height="140">
          <rect width="470" height="140" fill="black" />
          {logoPaths.map((d, index) => (
            <path id={`logo-letter-${index + 1}`} key={d} d={d} fill="none" stroke="white" strokeWidth="10" strokeLinecap="butt" strokeLinejoin="round" />
          ))}
        </mask>
        {/* Each reference-matched stroke has its own mask for individual motion studies. */}
        {logoPaths.map((d, index) => (
          <mask id={letterMaskIds[index]} key={letterMaskIds[index]} maskUnits="userSpaceOnUse" x="0" y="0" width="470" height="140">
            <rect width="470" height="140" fill="black" />
            <path d={d} fill="none" stroke="white" strokeWidth="10" strokeLinecap="butt" strokeLinejoin="round" />
          </mask>
        ))}
        <linearGradient id={highlightId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={logoAnimationConfig.highlightColor} stopOpacity="0" />
          <stop offset="0.38" stopColor={logoAnimationConfig.highlightColor} stopOpacity="0" />
          <stop offset="0.5" stopColor={logoAnimationConfig.highlightColor} stopOpacity="1" />
          <stop offset="0.62" stopColor={logoAnimationConfig.highlightColor} stopOpacity="0" />
          <stop offset="1" stopColor={logoAnimationConfig.highlightColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={isAnimated ? { scale: [1, logoAnimationConfig.scaleAmount, 1] } : { scale: 1 }}
        transition={{ duration: logoAnimationConfig.scaleDuration * speedMultiplier, delay: settleDelay, ease: logoAnimationConfig.easing }}
        onAnimationComplete={() => {
          if (isAnimated) onComplete?.();
        }}
      >
        {/* A quiet silhouette keeps the full wordmark legible before the liquid arrives. */}
        <g mask={`url(#${logoMaskId})`} opacity={isComplete ? 1 : logoAnimationConfig.silhouetteOpacity}>
          <rect width="470" height="140" fill={logoAnimationConfig.color} />
        </g>

        {/* A fresh rising wave is clipped to one letter at a time, creating the written sequence. */}
        {variant === "liquid" && letterMaskIds.map((letterMaskId, index) => (
          <g mask={`url(#${letterMaskId})`} key={letterMaskId}>
            <motion.path
              fill={logoAnimationConfig.color}
              initial={{ d: wavePath(logoAnimationConfig.waveStartY, logoAnimationConfig.waveStartAmplitude) }}
              animate={
                isAnimated
                  ? {
                      d: [
                        wavePath(logoAnimationConfig.waveStartY, logoAnimationConfig.waveStartAmplitude),
                        wavePath(logoAnimationConfig.waveMiddleY, logoAnimationConfig.waveMiddleAmplitude),
                        wavePath(logoAnimationConfig.waveEndY, logoAnimationConfig.waveEndAmplitude),
                      ],
                    }
                  : {
                      d: wavePath(
                        isWaiting ? logoAnimationConfig.waveStartY : logoAnimationConfig.waveEndY,
                        isWaiting ? logoAnimationConfig.waveStartAmplitude : logoAnimationConfig.waveEndAmplitude,
                      ),
                    }
              }
              transition={
                isAnimated
                  ? {
                      duration: logoAnimationConfig.letterDuration * speedMultiplier,
                      delay: (logoAnimationConfig.fillDelay + index * logoAnimationConfig.letterStagger) * speedMultiplier,
                      ease: logoAnimationConfig.easing,
                    }
                  : { duration: 0 }
              }
            />
          </g>
        ))}

        {/* One quiet left-to-right crop creates a continuous, editorial reveal. */}
        {variant === "editorial" && (
          <g mask={`url(#${logoMaskId})`}>
            <motion.rect
              x="0"
              y="0"
              height="140"
              fill={logoAnimationConfig.color}
              initial={{ width: 0 }}
              animate={isAnimated || isComplete ? { width: 470 } : { width: 0 }}
              transition={{ duration: 0.68 * speedMultiplier, ease: logoAnimationConfig.easing }}
            />
          </g>
        )}

        {/* Circular masks grow from each baseline like ink settling into paper. */}
        {variant === "ink" && letterMaskIds.map((letterMaskId, index) => (
          <g mask={`url(#${letterMaskId})`} key={letterMaskId}>
            <motion.circle
              cx={letterCenters[index]}
              cy="53"
              fill={logoAnimationConfig.color}
              initial={{ r: 0 }}
              animate={isAnimated || isComplete ? { r: 130 } : { r: 0 }}
              transition={{ duration: 0.52 * speedMultiplier, delay: index * 0.16 * speedMultiplier, ease: logoAnimationConfig.easing }}
            />
          </g>
        ))}

        {/* Flat-cut centerline strokes leave the final reference-matched logo behind like a pen pass. */}
        {variant === "pen" && (
          <>
            {logoPaths.map((d, index) => (
              <motion.path
                d={d}
                key={d}
                fill="none"
                stroke={logoAnimationConfig.color}
                strokeLinecap="butt"
                strokeLinejoin="miter"
                strokeWidth="10"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isAnimated || isComplete ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.5 * speedMultiplier, delay: index * 0.16 * speedMultiplier, ease: logoAnimationConfig.easing }}
              />
            ))}
          </>
        )}

        {/* Four small type movements overlap, like characters settling into a line. */}
        {variant === "typesetter" && letterMaskIds.map((letterMaskId, index) => (
          <g mask={`url(#${letterMaskId})`} key={letterMaskId}>
            <motion.rect
              x="0"
              y="0"
              width="470"
              height="140"
              fill={logoAnimationConfig.color}
              initial={{ opacity: 0, y: 14 }}
              animate={isAnimated || isComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.36 * speedMultiplier, delay: index * 0.14 * speedMultiplier, ease: logoAnimationConfig.easing }}
            />
          </g>
        ))}

        {/* A warm exposure band passes across a gradual full-logo reveal. */}
        {variant === "exposure" && (
          <g mask={`url(#${logoMaskId})`}>
            <motion.rect
              x="0"
              y="0"
              width="470"
              height="140"
              fill={logoAnimationConfig.color}
              initial={{ opacity: 0 }}
              animate={isAnimated ? { opacity: [0, 0.28, 1] } : { opacity: isComplete ? 1 : 0 }}
              transition={{ duration: 0.72 * speedMultiplier, ease: logoAnimationConfig.easing }}
            />
            <motion.rect
              y="0"
              width={logoAnimationConfig.highlightWidth}
              height="140"
              fill={`url(#${highlightId})`}
              initial={{ x: logoAnimationConfig.highlightStartX, opacity: 0 }}
              animate={isAnimated ? { x: logoAnimationConfig.highlightEndX, opacity: [0, 0.65, 0] } : { x: isWaiting ? logoAnimationConfig.highlightStartX : logoAnimationConfig.highlightEndX, opacity: 0 }}
              transition={{ duration: 0.6 * speedMultiplier, delay: 0.12 * speedMultiplier, ease: logoAnimationConfig.easing }}
            />
          </g>
        )}

        {variant === "liquid" && <g mask={`url(#${logoMaskId})`}>
          <motion.rect
            y="0"
            width={logoAnimationConfig.highlightWidth}
            height="140"
            fill={`url(#${highlightId})`}
            initial={{ x: logoAnimationConfig.highlightStartX, opacity: 0 }}
            animate={
              isAnimated
                ? {
                    x: logoAnimationConfig.highlightEndX,
                    opacity: [0, logoAnimationConfig.highlightOpacity, logoAnimationConfig.highlightOpacity, 0],
                  }
                : { x: isWaiting ? logoAnimationConfig.highlightStartX : logoAnimationConfig.highlightEndX, opacity: 0 }
            }
            transition={{
              duration: logoAnimationConfig.highlightDuration * speedMultiplier,
              delay: logoAnimationConfig.highlightDelay * speedMultiplier,
              ease: logoAnimationConfig.easing,
            }}
          />
        </g>}
      </motion.g>
    </svg>
  );
}
