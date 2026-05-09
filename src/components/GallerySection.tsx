"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Camera } from "lucide-react";

import { villas } from "@/lib/villas";

let galleryIndexCursor = 0;

const galleryGroups = villas.map((villa) => {
  const startIndex = galleryIndexCursor;
  galleryIndexCursor += villa.images.length;

  return {
    villaName: villa.name,
    tagline: villa.tagline,
    startIndex,
    images: villa.images,
  };
});

const galleryImages = galleryGroups.flatMap((group) =>
  group.images.map((src, imageIndex) => ({
    src,
    alt: `${group.villaName} gallery image ${imageIndex + 1}`,
  }))
);

export default function GallerySection() {
  const [index, setIndex] = useState(-1);
  const [activeGroup, setActiveGroup] = useState<string>("All");

  const visibleGroups =
    activeGroup === "All"
      ? galleryGroups
      : galleryGroups.filter((g) => g.villaName === activeGroup);

  return (
    <section id="gallery" className="relative py-28 bg-fog overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 md:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 mb-5 text-primary text-sm font-medium uppercase tracking-[0.25em]">
            <span className="w-8 h-px bg-primary" />
            Gallery
            <span className="w-8 h-px bg-primary" />
          </div>
          <h2 className="text-4xl md:text-6xl font-playfair text-dark mb-6 leading-[1.05] text-balance">
            Glimpses of <em className="text-primary not-italic">paradise</em>.
          </h2>
          <p className="text-dark/65 font-sans text-lg leading-relaxed text-balance">
            Every corner tells a story — interiors crafted with care, gardens kissed
            by mist, and moments that stay with you.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {["All", ...galleryGroups.map((g) => g.villaName)].map((label) => (
            <button
              key={label}
              onClick={() => setActiveGroup(label)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                activeGroup === label
                  ? "bg-primary text-white border-primary shadow-warm"
                  : "bg-white text-dark/70 border-mist hover:border-primary/40 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-16">
          {visibleGroups.map((group) => (
            <div key={group.villaName}>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70 mb-2">
                    {group.tagline}
                  </p>
                  <h3 className="font-playfair text-3xl md:text-4xl text-dark">
                    {group.villaName}
                  </h3>
                </div>
                <span className="text-sm font-medium text-dark/50 flex items-center gap-1.5 shrink-0">
                  <Camera className="w-4 h-4" />
                  {group.images.length} photos
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {group.images.map((src, imageIndex) => {
                  const globalIndex = group.startIndex + imageIndex;
                  const isFeatured = imageIndex === 0;

                  return (
                    <motion.button
                      type="button"
                      key={src}
                      initial={{ opacity: 0, scale: 0.92 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: (imageIndex % 4) * 0.06, duration: 0.5 }}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl shadow-warm ${
                        isFeatured
                          ? "col-span-2 row-span-2 aspect-square md:aspect-[4/3]"
                          : "aspect-[3/4]"
                      }`}
                      onClick={() => setIndex(globalIndex)}
                    >
                      <Image
                        src={src}
                        alt={`${group.villaName} gallery image ${imageIndex + 1}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                        <span className="text-white text-xs font-medium glass px-3 py-1 rounded-full">
                          View photo
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={galleryImages}
      />
    </section>
  );
}
