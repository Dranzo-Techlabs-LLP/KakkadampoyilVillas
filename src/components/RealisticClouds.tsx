"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function RealisticClouds() {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax effects for clouds moving while scrolling
  const cloud1Y = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const cloud1X = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  
  const cloud2Y = useTransform(scrollYProgress, [0, 1], ["0%", "120%"]);
  const cloud2X = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Cloud Layer 1 - Moves slower and slightly right */}
      <motion.div
        style={{ y: cloud1Y, x: cloud1X, backgroundImage: "url('/images/cloud1.png')" }}
        className="absolute inset-0 h-[150%] w-[150%] -left-[25%] -top-[25%] opacity-50 mix-blend-screen bg-cover bg-center"
      />
      
      {/* Cloud Layer 2 - Moves faster and slightly left */}
      <motion.div
        style={{ y: cloud2Y, x: cloud2X, backgroundImage: "url('/images/cloud2.png')" }}
        className="absolute inset-0 h-[150%] w-[150%] -left-[25%] -top-[25%] opacity-60 mix-blend-screen bg-cover bg-center"
      />
    </div>
  );
}
