import { useState } from "react";
import AnimatedLogo, { LogoAnimationSpeedContext, logoAnimationConfig, type LogoAnimationVariant } from "./components/AnimatedLogo";
import "./styles/animated-logo-demo.css";

export default function App() {
  const [replayKey, setReplayKey] = useState(0);
  const [slowMotion, setSlowMotion] = useState(false);

  return (
    <LogoAnimationSpeedContext value={slowMotion ? logoAnimationConfig.slowMotionMultiplier : 1}>
    <section id="logo-demo" className="logo-demo" aria-labelledby="logo-demo-title">
      <div className="logo-demo__header">
        <div>
          <p className="logo-demo__eyebrow">Nuun motion studies</p>
          <h2 id="logo-demo-title">Five ways in</h2>
        </div>
        <div className="logo-demo__controls">
          <button type="button" onClick={() => setReplayKey((current) => current + 1)}>
            Replay
          </button>
          <button type="button" aria-pressed={slowMotion} onClick={() => setSlowMotion((current) => !current)}>
            {slowMotion ? "Normal speed" : "Slow motion"}
          </button>
        </div>
      </div>
      <div className="logo-demo__grid logo-demo__grid--studies">
        {studies.map((study, index) => (
          <article className={`logo-demo__panel ${index % 2 === 0 ? "logo-demo__panel--light" : "logo-demo__panel--dark"}`} key={study.variant}>
            <p>{study.name}</p>
            <strong className="logo-demo__description">{study.description}</strong>
            <AnimatedLogo replayKey={replayKey} variant={study.variant} className="logo-demo__mark" />
          </article>
        ))}
      </div>
    </section>
    </LogoAnimationSpeedContext>
  );
}
  const studies: Array<{ variant: LogoAnimationVariant; name: string; description: string }> = [
    { variant: "editorial", name: "01 Editorial reveal", description: "One continuous soft reveal across the full wordmark." },
    { variant: "ink", name: "02 Ink spread", description: "Orange pools rise from each letter’s baseline." },
    { variant: "pen", name: "03 Pen pass", description: "A tracing outline resolves into the solid form." },
    { variant: "typesetter", name: "04 Typesetter", description: "Letters settle into place as a composed line." },
    { variant: "exposure", name: "05 Light exposure", description: "A warm scan illuminates the finished mark." },
  ];
