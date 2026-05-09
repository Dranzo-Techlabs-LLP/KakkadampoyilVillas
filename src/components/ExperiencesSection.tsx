"use client";

import { motion } from "framer-motion";
import { Droplets, Trees, Sunrise, Coffee, Mountain, Bird } from "lucide-react";
import NatureElements from "./NatureElements";

export default function ExperiencesSection() {
  const experiences = [
    {
      icon: Droplets,
      title: "Hidden Waterfalls",
      description: "Cascading falls tucked deep inside the Western Ghats forest.",
      tag: "Nature",
    },
    {
      icon: Trees,
      title: "Forest Trekking",
      description: "Guided trails through endemic flora, rare birds, and quiet streams.",
      tag: "Adventure",
    },
    {
      icon: Sunrise,
      title: "Sunrise Viewpoint",
      description: "Watch the valley emerge from a sea of clouds at dawn.",
      tag: "Vista",
    },
    {
      icon: Coffee,
      title: "Plantation Walks",
      description: "Stroll fragrant spice and coffee estates a short drive away.",
      tag: "Heritage",
    },
    {
      icon: Mountain,
      title: "Tribal Trails",
      description: "Visit ancient Kuttiyadi tribal hamlets with a local guide.",
      tag: "Culture",
    },
    {
      icon: Bird,
      title: "Birdwatching",
      description: "Over 100 species call these hills home — including the Malabar trogon.",
      tag: "Wildlife",
    },
  ];

  return (
    <section id="experiences" className="relative py-28 bg-dark overflow-hidden">
      <NatureElements variant="breeze" density={0.9} tone="dark" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark/95 to-dark pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 mb-5 text-accent-soft text-sm font-medium uppercase tracking-[0.25em]">
            <span className="w-8 h-px bg-accent-soft" />
            Experiences
            <span className="w-8 h-px bg-accent-soft" />
          </div>
          <h2 className="text-4xl md:text-6xl font-playfair text-white mb-6 leading-[1.05] text-balance">
            What awaits beyond <em className="text-accent-soft not-italic">your door</em>.
          </h2>
          <p className="text-white/70 font-sans text-lg leading-relaxed text-balance">
            From hidden waterfalls to plantation walks, the hills around Kakkadampoyil
            are yours to wander.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {experiences.map((exp, idx) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.06, duration: 0.6 }}
              className="group relative glass rounded-3xl p-7 hover:bg-white/15 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary-soft/20 rounded-full blur-3xl group-hover:bg-accent/20 transition-colors duration-700" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl gradient-leaf flex items-center justify-center text-white shadow-leaf">
                    <exp.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-soft glass px-3 py-1 rounded-full">
                    {exp.tag}
                  </span>
                </div>
                <h3 className="text-2xl font-playfair text-white mb-3">{exp.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
