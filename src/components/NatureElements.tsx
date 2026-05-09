"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import styles from "./NatureElements.module.css";

type Variant = "leaves" | "breeze" | "mix" | "rain";

interface Props {
  variant?: Variant;
  density?: number;
  className?: string;
  tone?: "light" | "dark";
}

const LEAF_COLORS_LIGHT = ["#3F7E54", "#5A7A4F", "#8AA86F", "#1F4D2B", "#C99B5C", "#9DBE7C"];
const LEAF_COLORS_DARK = ["#9DBE7C", "#C99B5C", "#E5C492", "#8AA86F", "#5A7A4F", "#A8D0A8"];

function rand(seed: number, n: number) {
  const v = Math.sin(seed * (n + 1) * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

function LeafSvg({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 32 48"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2 C26 8, 30 22, 22 38 C20 42, 18 45, 16 46 C14 45, 12 42, 10 38 C2 22, 6 8, 16 2 Z"
        fill={color}
      />
      <path d="M16 4 L16 44" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" strokeLinecap="round" />
      <path
        d="M16 14 L22 18 M16 22 L24 26 M16 30 L22 34 M16 14 L10 18 M16 22 L8 26 M16 30 L10 34"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NatureElements({
  variant = "mix",
  density = 1,
  className = "",
  tone = "light",
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const palette = tone === "dark" ? LEAF_COLORS_DARK : LEAF_COLORS_LIGHT;

  const leafCount = Math.round(
    (variant === "rain" ? 0 : variant === "leaves" ? 18 : variant === "breeze" ? 10 : 14) *
      density
  );

  const leaves = useMemo(
    () =>
      Array.from({ length: leafCount }, (_, i) => {
        const s = i * 9301 + 49297;
        return {
          left: `${rand(s, 1) * 100}%`,
          size: 14 + rand(s, 2) * 28,
          duration: 14 + rand(s, 3) * 18,
          delay: -rand(s, 4) * 30,
          drift: 8 + rand(s, 5) * 22,
          color: palette[i % palette.length],
          opacity: 0.55 + rand(s, 6) * 0.4,
          spin: 360 + Math.floor(rand(s, 7) * 540),
          variant: i % 3,
        };
      }),
    [leafCount, palette]
  );

  const streaks = useMemo(
    () =>
      Array.from(
        { length: variant === "rain" ? Math.round(40 * density) : 0 },
        (_, i) => {
          const s = i * 7919 + 3271;
          return {
            left: `${rand(s, 1) * 100}%`,
            duration: 0.8 + rand(s, 2) * 0.9,
            delay: -rand(s, 3) * 2,
            height: 30 + rand(s, 4) * 50,
            opacity: 0.25 + rand(s, 5) * 0.35,
          };
        }
      ),
    [variant, density]
  );

  const breezeLines = useMemo(
    () =>
      Array.from(
        {
          length:
            variant === "breeze" || variant === "mix"
              ? Math.round(8 * density)
              : 0,
        },
        (_, i) => {
          const s = i * 4133 + 2017;
          return {
            top: `${10 + rand(s, 1) * 80}%`,
            duration: 8 + rand(s, 2) * 8,
            delay: -rand(s, 3) * 12,
            width: 80 + rand(s, 4) * 200,
            opacity: 0.08 + rand(s, 5) * 0.12,
          };
        }
      ),
    [variant, density]
  );

  if (!mounted) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {leaves.map((l, i) => {
        const cls =
          l.variant === 0 ? styles.leafA : l.variant === 1 ? styles.leafB : styles.leafC;
        const style: CSSProperties & Record<string, string | number> = {
          position: "absolute",
          top: "-10%",
          left: l.left,
          width: `${l.size}px`,
          height: `${l.size * 1.5}px`,
          opacity: l.opacity,
          animationDuration: `${l.duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDelay: `${l.delay}s`,
          willChange: "transform",
          "--drift": `${l.drift}vw`,
          "--spin": `${l.spin}deg`,
        };
        return (
          <span key={`leaf-${i}`} className={cls} style={style}>
            <LeafSvg color={l.color} />
          </span>
        );
      })}

      {streaks.map((s, i) => (
        <span
          key={`rain-${i}`}
          className={styles.rain}
          style={{
            position: "absolute",
            top: "-10%",
            left: s.left,
            width: 1,
            height: `${s.height}px`,
            background: `linear-gradient(to bottom, transparent, ${
              tone === "dark" ? "rgba(180,210,230,0.7)" : "rgba(120,160,180,0.7)"
            }, transparent)`,
            animationDuration: `${s.duration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDelay: `${s.delay}s`,
            opacity: s.opacity,
            willChange: "transform",
          }}
        />
      ))}

      {breezeLines.map((b, i) => (
        <span
          key={`breeze-${i}`}
          className={styles.breeze}
          style={{
            position: "absolute",
            top: b.top,
            left: "-20%",
            width: `${b.width}px`,
            height: 1,
            background: `linear-gradient(to right, transparent, ${
              tone === "dark" ? "rgba(229,196,146,0.55)" : "rgba(31,77,43,0.45)"
            }, transparent)`,
            animationDuration: `${b.duration}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${b.delay}s`,
            opacity: b.opacity,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
