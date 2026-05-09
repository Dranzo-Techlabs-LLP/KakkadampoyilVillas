"use client";

import { motion, useScroll, useVelocity, useTransform, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const random = (min: number, max: number) => Math.random() * (max - min) + min;

export default function WindEffect() {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  
  // Smooth out the velocity so it doesn't instantly snap
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });

  // Map velocity to the horizontal skew to simulate wind pushing the leaves
  const skewX = useTransform(smoothVelocity, [-1000, 0, 1000], [45, 0, -45]);
  
  // Show wind lines strongly only when scrolling
  const windOpacity = useTransform(smoothVelocity, [-500, 0, 500], [0.5, 0, 0.5]);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [windLines, setWindLines] = useState<any[]>([]);

  useEffect(() => {
    // Generate static initial properties for the leaves
    const generatedLeaves = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      size: random(15, 45),
      startY: random(-20, 120),
      duration: random(8, 20),
      delay: random(0, 15),
      opacity: random(0.3, 0.8),
      z: random(-200, 200), // for 3D perspective
      color: random(0, 1) > 0.5 ? "text-emerald-700/60" : "text-green-800/50",
      sway: random(50, 150)
    }));

    const generatedWindLines = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      y: random(5, 95),
      width: random(150, 400),
      duration: random(1, 2.5),
      delay: random(0, 5),
    }));

    setLeaves(generatedLeaves);
    setWindLines(generatedWindLines);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Leaves */}
      {leaves.map((leaf) => (
        <motion.div
          key={`leaf-${leaf.id}`}
          className={`absolute ${leaf.color}`}
          style={{
            top: `${leaf.startY}%`,
            z: leaf.z, // 3D depth
            skewX: skewX, // Skew based on scroll velocity!
          }}
          initial={{ left: "-10%", rotate: 0 }}
          animate={{ 
            left: "110%", 
            rotate: 360,
            y: [0, leaf.sway, -leaf.sway, 0] // Sway up and down randomly
          }}
          transition={{
            left: {
              duration: leaf.duration,
              repeat: Infinity,
              ease: "linear",
              delay: leaf.delay,
            },
            rotate: {
              duration: leaf.duration * 0.8,
              repeat: Infinity,
              ease: "linear",
            },
            y: {
              duration: leaf.duration * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width={leaf.size} height={leaf.size}>
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
          </svg>
        </motion.div>
      ))}

      {/* Anime Wind Lines that appear mostly when scrolling */}
      {windLines.map((line) => (
        <motion.div
          key={`wind-${line.id}`}
          className="absolute bg-white rounded-full"
          style={{
            top: `${line.y}%`,
            width: line.width,
            height: "2px",
            filter: "blur(2px)",
            opacity: windOpacity, // Only visible when scrolling!
          }}
          initial={{ left: "-20%" }}
          animate={{ left: "120%" }}
          transition={{
            duration: line.duration,
            repeat: Infinity,
            ease: "linear",
            delay: line.delay,
          }}
        />
      ))}
    </div>
  );
}
