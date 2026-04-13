import { useEffect, useState, type CSSProperties } from "react";

type SprayStreak = {
  id: number;
  top?: string;
  left?: string;
  right?: string;
  width: string;
  height: string;
  angle: string;
  duration: string;
  delay: string;
  driftX: string;
  driftY: string;
  flip: string;
  variant: "one" | "two" | "three";
};

const STREAK_COUNT = 4;
const LOOP_MS = 3600;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createStreak(index: number): SprayStreak {
  const anchorRight = Math.random() > 0.55;
  const variant = (["one", "two", "three"] as const)[index % 3];
  const top = `${randomBetween(12, 78).toFixed(1)}%`;
  const width = `${randomBetween(22, 42).toFixed(1)}vw`;
  const height = `${randomBetween(14, 22).toFixed(1)}px`;
  const angle = `${randomBetween(-16, 14).toFixed(1)}deg`;
  const duration = `${randomBetween(3.0, 4.3).toFixed(2)}s`;
  const delay = `${(index * 0.45).toFixed(2)}s`;
  const driftX = `${randomBetween(18, 38).toFixed(1)}px`;
  const driftY = `${randomBetween(-14, 14).toFixed(1)}px`;

  return {
    id: index,
    top,
    left: anchorRight ? undefined : `${randomBetween(6, 52).toFixed(1)}%`,
    right: anchorRight ? `${randomBetween(6, 28).toFixed(1)}%` : undefined,
    width,
    height,
    angle,
    duration,
    delay,
    driftX,
    driftY,
    flip: anchorRight ? "-1" : "1",
    variant,
  };
}

function buildStreaks() {
  return Array.from({ length: STREAK_COUNT }, (_, index) => createStreak(index));
}

export default function AuthSprayLayer() {
  const [streaks, setStreaks] = useState<SprayStreak[]>(() => buildStreaks());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStreaks(buildStreaks());
    }, LOOP_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      {streaks.map((streak) => (
        <div
          key={`${streak.id}-${streak.top}-${streak.left ?? streak.right}`}
          className={`paint-streak paint-streak-${streak.variant}`}
          style={
            {
              top: streak.top,
              left: streak.left,
              right: streak.right,
              width: streak.width,
              height: streak.height,
              "--spray-angle": streak.angle,
              "--spray-duration": streak.duration,
              "--spray-delay": streak.delay,
              "--spray-drift-x": streak.driftX,
              "--spray-drift-y": streak.driftY,
              "--spray-flip": streak.flip,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
