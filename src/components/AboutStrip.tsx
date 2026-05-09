"use client";

import { motion } from "framer-motion";
import { Leaf, Mountain, Sparkles, Wind } from "lucide-react";
import Link from "next/link";

export default function AboutStrip() {
  const stats = [
    { icon: Mountain, label: "Elevation", value: "3000+ ft" },
    { icon: Leaf, label: "Private Villas", value: "3" },
    { icon: Wind, label: "Mist & Breeze", value: "365d" },
    { icon: Sparkles, label: "Service Tier", value: "5★" },
  ];

  return (
    <section className="relative bg-gradient-to-b from-fog via-mist to-white py-24 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-accent/8 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-6 text-primary text-sm font-medium uppercase tracking-[0.25em]">
              <span className="w-8 h-px bg-primary" />
              Our Sanctuary
            </div>
            <h2 className="text-4xl md:text-6xl font-playfair text-dark mb-8 leading-[1.05] text-balance">
              A boutique retreat <em className="text-primary not-italic font-normal">above</em> the clouds.
            </h2>
            <p className="text-dark/75 font-sans text-lg leading-relaxed mb-6 text-balance">
              Tucked into the mist-veiled hills of Kakkadampoyil, our villas
              blend Kerala's heritage architecture with quiet, modern luxury.
              Wake to birdsong, drift through rain-cooled gardens, dine under a
              canopy of stars.
            </p>
            <p className="text-dark/60 font-sans leading-relaxed mb-10">
              Every villa is fully private — your own gated retreat with pool, garden,
              and panoramic forest views.
            </p>
            <Link
              href="#villas"
              className="inline-flex items-center gap-3 text-primary font-semibold border-b-2 border-primary/30 pb-1 hover:border-primary transition-colors group"
            >
              Explore the villas
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 gap-5">
            {stats.map((s, idx) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.6 }}
                className={`relative bg-white rounded-3xl p-7 shadow-warm border border-mist/60 ${
                  idx % 2 === 1 ? "translate-y-6" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-2xl gradient-leaf flex items-center justify-center text-white mb-5 shadow-leaf">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl md:text-4xl font-playfair text-dark mb-1">
                  {s.value}
                </div>
                <div className="text-xs font-semibold text-secondary uppercase tracking-[0.18em]">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
