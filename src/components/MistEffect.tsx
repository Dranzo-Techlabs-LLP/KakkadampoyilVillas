"use client";

import { motion } from "framer-motion";

export default function MistEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Mist layer 1 - moves left to right */}
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ 
          x: ["-100%", "100%"],
          opacity: [0, 0.5, 0] 
        }}
        transition={{
          repeat: Infinity,
          duration: 35,
          ease: "linear",
        }}
        className="absolute inset-0 h-full w-[200%] opacity-40 mix-blend-screen"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(255,255,255,0.5) 0%, transparent 50%)",
          backgroundSize: "50% 100%",
        }}
      />
      
      {/* Mist layer 2 - moves right to left, slower */}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ 
          x: ["100%", "-100%"],
          opacity: [0, 0.4, 0] 
        }}
        transition={{
          repeat: Infinity,
          duration: 45,
          ease: "linear",
          delay: 5
        }}
        className="absolute inset-0 h-full w-[200%] opacity-30 mix-blend-screen"
        style={{
          backgroundImage: "radial-gradient(circle at 30% 60%, rgba(255,255,255,0.4) 0%, transparent 70%), radial-gradient(circle at 70% 40%, rgba(255,255,255,0.3) 0%, transparent 60%)",
          backgroundSize: "60% 120%",
        }}
      />
    </div>
  );
}
