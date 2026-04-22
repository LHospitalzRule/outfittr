import { useEffect, useState, type CSSProperties } from "react";

type SprayStreak = {
  id: number;
  top?: string;
  left?: string;
  width: string;
  height: string;
  angle: string;
  glyph: string;
  variant: "one" | "two" | "three";
};

const SLASH_COUNT = 13;
const GLYPH_SLICES = 5;
const STEP_MS = 430;
const HOLD_STEPS = 3;
const GLYPHS = ["衣", "風", "型", "街", "装", "墨", "影", "道"];
const POSITIONS = [
  { top: 8, left: 50, angle: 0 },
  { top: 15, left: 65, angle: 30 },
  { top: 29, left: 76, angle: 60 },
  { top: 48, left: 80, angle: 90 },
  { top: 67, left: 76, angle: 120 },
  { top: 81, left: 65, angle: 150 },
  { top: 88, left: 50, angle: 180 },
  { top: 81, left: 35, angle: -150 },
  { top: 67, left: 24, angle: -120 },
  { top: 48, left: 20, angle: -90 },
  { top: 29, left: 24, angle: -60 },
  { top: 15, left: 35, angle: -30 },
  { top: 8, left: 50, angle: 0 },
];

function createStreak(index: number): SprayStreak {
  const variant = (["one", "two", "three"] as const)[index % 3];
  const position = POSITIONS[index % POSITIONS.length];
  const top = `${position.top}%`;
  const left = `${position.left}%`;
  const width = `${index % 2 === 0 ? 190 : 168}px`;
  const height = `${index % 3 === 0 ? 132 : 118}px`;
  const angle = `${position.angle}deg`;
  const glyph = GLYPHS[index % GLYPHS.length];

  return {
    id: index,
    top,
    left,
    width,
    height,
    angle,
    glyph,
    variant,
  };
}

function buildStreaks() {
  return Array.from({ length: SLASH_COUNT }, (_, index) => createStreak(index));
}

export default function AuthSprayLayer() {
  const [streaks] = useState<SprayStreak[]>(() => buildStreaks());
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleCount((currentCount) => {
        const nextCount = currentCount + 1;
        return nextCount > SLASH_COUNT + HOLD_STEPS ? 0 : nextCount;
      });
    }, STEP_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      {streaks.map((streak, index) => {
        const isVisible = index < Math.min(visibleCount, SLASH_COUNT);
        const isDrawing = index === visibleCount - 1;

        return (
          <div
            key={`${streak.id}-${streak.top}-${streak.left}-${streak.angle}`}
            className={`paint-streak paint-streak-${streak.variant}${
              isVisible ? " is-visible" : ""
            }${isDrawing ? " is-drawing" : ""}`}
            style={
              {
                top: streak.top,
                left: streak.left,
                width: streak.width,
                height: streak.height,
                "--spray-angle": streak.angle,
              } as CSSProperties
            }
          >
            <span className="slash-symbol" aria-hidden="true">
              {Array.from({ length: GLYPH_SLICES }, (_, sliceIndex) => (
                <span
                  key={sliceIndex}
                  className={`glyph-slice glyph-slice-${sliceIndex + 1}`}
                >
                  {streak.glyph}
                </span>
              ))}
            </span>
            <i className="slash slash-main" />
            <i className="slash slash-cross" />
            <i className="slash slash-short" />
          </div>
        );
      })}
    </>
  );
}
