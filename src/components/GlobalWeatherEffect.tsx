"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export default function GlobalWeatherEffect() {
  const { scrollYProgress } = useScroll();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parallax effects for clouds moving while scrolling
  // Negative values mean they move up as we scroll down, creating depth against the document scroll
  const cloud1Y = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const cloud1X = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  
  const cloud2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);
  const cloud2X = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  // Rain particles: moving down faster than the scroll to simulate falling while scrolling
  const rain1Y = useTransform(scrollYProgress, [0, 1], ["0%", "150%"]);
  const rain2Y = useTransform(scrollYProgress, [0, 1], ["0%", "250%"]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Cloud Layer 1 */}
      <motion.div
        style={{ y: cloud1Y, x: cloud1X, backgroundImage: "url('/images/cloud1.png')" }}
        className="absolute inset-0 h-[150%] w-[150%] -left-[25%] -top-[25%] bg-cover bg-center opacity-[0.15] mix-blend-overlay"
      />
      
      {/* Cloud Layer 2 */}
      <motion.div
        style={{ y: cloud2Y, x: cloud2X, backgroundImage: "url('/images/cloud2.png')" }}
        className="absolute inset-0 h-[150%] w-[150%] -left-[25%] -top-[25%] bg-cover bg-center opacity-[0.2] mix-blend-overlay"
      />

      {/* Rain Layer 1 */}
      <motion.div
        className="absolute -top-[100%] left-0 right-0 h-[300%] w-full opacity-30"
        style={{
          backgroundImage: "linear-gradient(transparent, rgba(150,150,150,0.4) 50%, transparent)",
          backgroundSize: "20px 100px",
          backgroundRepeat: "repeat",
          y: rain1Y
        }}
      />
      
      {/* Rain Layer 2 */}
      <motion.div
        className="absolute -top-[100%] left-[10px] right-0 h-[300%] w-full opacity-20"
        style={{
          backgroundImage: "linear-gradient(transparent, rgba(100,100,100,0.3) 50%, transparent)",
          backgroundSize: "15px 70px",
          backgroundRepeat: "repeat",
          y: rain2Y
        }}
      />
    </div>
  );
}
