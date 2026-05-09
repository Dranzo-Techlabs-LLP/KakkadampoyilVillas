"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin, ChevronDown, Leaf, Sparkles as SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import NatureElements from "./NatureElements";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.18, delayChildren: 0.25 },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center bg-dark"
    >
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/30 via-dark/55 to-dark/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-bark/30 mix-blend-soft-light" />
      </motion.div>

      <NatureElements variant="mix" density={1.2} tone="dark" className="z-[1]" />

      <div className="absolute top-1/4 left-8 w-72 h-72 bg-primary-soft/20 rounded-full blur-3xl z-[2] animate-[pulse-soft_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 right-8 w-96 h-96 bg-accent/15 rounded-full blur-3xl z-[2] animate-[pulse-soft_10s_ease-in-out_infinite]" />

      <motion.div
        style={{ opacity }}
        className="container relative z-10 mx-auto px-6 md:px-12 pt-24 pb-12 flex flex-col items-center text-center"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto flex flex-col items-center"
        >
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full text-white/95"
          >
            <Leaf className="w-4 h-4 text-accent-soft" />
            <span className="text-sm font-medium tracking-wide">
              Kakkadampoyil · Western Ghats, Kerala
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-[8rem] font-playfair text-white leading-[0.95] mb-8 text-balance tracking-tight"
          >
            Where the{" "}
            <span className="italic font-light text-mist">mist</span>
            <br className="hidden md:block" />
            kisses the{" "}
            <span className="italic font-light bg-gradient-to-r from-accent-soft via-accent to-accent-soft bg-clip-text text-transparent">
              hills
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl text-white/85 mb-12 max-w-2xl font-sans font-light text-balance leading-relaxed"
          >
            Three private villas. Untouched forests. One unforgettable Kerala escape — wrapped in clouds, scented with rain.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link
              href="#villas"
              className="group relative bg-accent text-dark px-9 py-4 rounded-full font-semibold text-base transition-all hover:scale-[1.03] shadow-leaf overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Discover Villas
                <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-accent-soft to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="#contact"
              className="glass text-white px-9 py-4 rounded-full font-medium text-base transition-all hover:bg-white/15 hover:scale-[1.02]"
            >
              Plan Your Stay
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-16 grid grid-cols-3 gap-8 md:gap-16 text-white/85"
          >
            {[
              { v: "3000+", l: "ft elevation" },
              { v: "3", l: "private villas" },
              { v: "100%", l: "privacy" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="font-playfair text-3xl md:text-4xl text-white">{s.v}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/60 mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
      >
        <span className="text-white/60 text-[10px] uppercase tracking-[0.3em] mb-2">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="text-white/80 w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
