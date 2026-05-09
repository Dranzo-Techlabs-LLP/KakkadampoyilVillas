"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Users, BedDouble, CheckCircle2, Sparkles, ZoomIn } from "lucide-react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Villa } from "@/lib/villas";
import Link from "next/link";
import { useEffect, useState } from "react";

interface VillaDetailModalProps {
  villa: Villa | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VillaDetailModal({ villa, isOpen, onClose }: VillaDetailModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setLightboxIndex(-1);
  }, [isOpen]);

  if (!villa) return null;

  const slides = villa.images.map((src, i) => ({
    src,
    alt: `${villa.name} photo ${i + 1}`,
  }));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-6 py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-dark/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 z-30 w-10 h-10 grid place-items-center bg-white/90 hover:bg-white backdrop-blur-md rounded-full text-dark transition-colors shadow-warm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto flex-grow flex flex-col">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="relative w-full h-56 sm:h-72 md:h-96 shrink-0 group cursor-zoom-in"
                  aria-label="Open photo gallery"
                >
                  <Image
                    src={villa.coverImage}
                    alt={villa.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
                  <div className="absolute top-5 left-5 glass px-3 py-1.5 rounded-full text-xs font-medium tracking-wide text-white inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {villa.tagline}
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 sm:right-auto text-left">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair text-white mb-1.5 leading-tight">
                      {villa.name}
                    </h2>
                    <p className="text-white/85 text-sm sm:text-base font-sans flex items-center gap-2">
                      <ZoomIn className="w-4 h-4" />
                      {villa.images.length} photos · tap to view gallery
                    </p>
                  </div>
                </button>

                <div className="p-6 md:p-10">
                  <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-10">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                        About
                      </h3>
                      <p className="text-dark/80 font-sans leading-relaxed mb-10 text-base sm:text-lg">
                        {villa.description}
                      </p>

                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-5 mb-10">
                        {villa.amenities.map((a) => (
                          <div
                            key={a}
                            className="flex items-center gap-2 text-dark/80 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                          Photo Gallery
                        </h3>
                        <span className="text-xs text-dark/50">
                          {villa.images.length} photos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {villa.images.map((src, idx) => (
                          <button
                            type="button"
                            key={src}
                            onClick={() => setLightboxIndex(idx)}
                            className="group relative aspect-square overflow-hidden rounded-xl shadow-warm hover:shadow-leaf transition-all cursor-zoom-in"
                            aria-label={`Open photo ${idx + 1}`}
                          >
                            <Image
                              src={src}
                              alt={`${villa.name} photo ${idx + 1}`}
                              fill
                              unoptimized
                              loading="lazy"
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 200px"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <aside className="lg:sticky lg:top-4 self-start">
                      <div className="bg-fog rounded-2xl p-6 border border-mist">
                        <h4 className="font-playfair text-xl text-dark mb-5 pb-3 border-b border-mist">
                          Villa at a glance
                        </h4>
                        <div className="space-y-4">
                          <Row
                            icon={<Users className="w-4 h-4" />}
                            label="Capacity"
                            value={
                              <>
                                {villa.capacity.adults + villa.capacity.children} guests
                                <span className="block text-xs text-dark/55 mt-0.5">
                                  {villa.capacity.adults} adults · {villa.capacity.children} children
                                </span>
                              </>
                            }
                          />
                          <Row
                            icon={<BedDouble className="w-4 h-4" />}
                            label="Bedrooms"
                            value={`${villa.bedrooms}`}
                          />
                          <div className="pt-4 mt-2 border-t border-mist">
                            <div className="text-xs uppercase tracking-[0.18em] text-dark/55 mb-1">
                              Pricing
                            </div>
                            <div className="font-playfair font-semibold text-primary text-2xl">
                              {villa.pricePerNight}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link
                        href="#contact"
                        onClick={onClose}
                        className="mt-4 w-full py-4 rounded-2xl bg-primary text-white text-center font-semibold shadow-leaf hover:bg-dark transition-colors flex items-center justify-center gap-2"
                      >
                        Enquire / Book
                        <Sparkles className="w-4 h-4" />
                      </Link>
                    </aside>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Lightbox
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        slides={slides}
      />
    </>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-dark/65 text-sm">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-medium text-dark text-sm text-right">{value}</span>
    </div>
  );
}
