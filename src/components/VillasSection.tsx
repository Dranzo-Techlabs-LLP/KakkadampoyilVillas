"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { villas, Villa } from "@/lib/villas";
import VillaCard from "./VillaCard";
import VillaDetailModal from "./VillaDetailModal";

export default function VillasSection() {
  const [selectedVilla, setSelectedVilla] = useState<Villa | null>(null);

  return (
    <section id="villas" className="relative py-28 bg-white overflow-hidden">
      <div className="absolute top-40 -left-32 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 md:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 mb-5 text-primary text-sm font-medium uppercase tracking-[0.25em]">
            <span className="w-8 h-px bg-primary" />
            Our Villas
            <span className="w-8 h-px bg-primary" />
          </div>
          <h2 className="text-4xl md:text-6xl font-playfair text-dark mb-6 leading-[1.05] text-balance">
            Three retreats. One <em className="text-primary not-italic">untamed</em> hillside.
          </h2>
          <p className="text-dark/65 font-sans text-lg leading-relaxed text-balance">
            Each villa is fully private, individually styled, and surrounded by forest.
            Pick the one that matches your weekend mood.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {villas.map((villa, i) => (
            <motion.div
              key={villa.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
            >
              <VillaCard villa={villa} onViewDetails={setSelectedVilla} />
            </motion.div>
          ))}
        </div>
      </div>

      <VillaDetailModal
        villa={selectedVilla}
        isOpen={!!selectedVilla}
        onClose={() => setSelectedVilla(null)}
      />
    </section>
  );
}
