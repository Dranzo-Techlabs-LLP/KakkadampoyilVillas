"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Users, BedDouble, ArrowUpRight, Wifi, Waves } from "lucide-react";
import { Villa } from "@/lib/villas";
import Tilt from "react-parallax-tilt";

interface VillaCardProps {
  villa: Villa;
  onViewDetails: (villa: Villa) => void;
}

export default function VillaCard({ villa, onViewDetails }: VillaCardProps) {
  const featured = villa.amenities.slice(0, 3);

  return (
    <Tilt
      tiltMaxAngleX={4}
      tiltMaxAngleY={4}
      scale={1.015}
      transitionSpeed={2200}
      glareEnable
      glareMaxOpacity={0.12}
      glareColor="#ffffff"
      glarePosition="all"
      className="h-full"
    >
      <button
        onClick={() => onViewDetails(villa)}
        className="group text-left w-full h-full flex flex-col bg-white rounded-3xl overflow-hidden shadow-warm hover:shadow-leaf transition-all duration-500 border border-mist/70 cursor-pointer"
      >
        <div className="relative aspect-[5/6] w-full overflow-hidden">
          <Image
            src={villa.coverImage}
            alt={villa.name}
            fill
            className="object-cover transition-transform duration-[1200ms] group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/85 via-dark/20 to-transparent" />

          <div className="absolute top-5 left-5 glass-strong px-3.5 py-1.5 rounded-full">
            <span className="font-playfair font-semibold text-primary text-xs tracking-wide">
              {villa.tagline}
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <h3 className="font-playfair text-3xl md:text-4xl text-white mb-2 leading-tight">
              {villa.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {featured.map((a) => (
                <span
                  key={a}
                  className="text-[10px] font-medium uppercase tracking-wider text-white/85 glass px-2.5 py-1 rounded-full"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white text-primary flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-leaf">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-7 flex flex-col flex-grow">
          <p className="text-dark/70 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
            {villa.description}
          </p>

          <div className="flex items-center gap-5 mb-6 text-sm text-dark/80 pb-6 border-b border-mist">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              <span>{villa.capacity.adults + villa.capacity.children} guests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-primary" />
              <span>{villa.bedrooms} BHK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-primary" />
              <span>Pool</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-primary" />
              <span>WiFi</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-dark/50 uppercase tracking-wider mb-0.5">
                Pricing
              </div>
              <div className="font-playfair font-semibold text-primary text-lg">
                {villa.pricePerNight}
              </div>
            </div>
            <div className="text-primary font-semibold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              View Details
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </button>
    </Tilt>
  );
}
