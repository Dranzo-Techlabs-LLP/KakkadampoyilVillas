"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import NatureElements from "./NatureElements";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-dark pt-24 pb-10 text-white/80 overflow-hidden">
      <NatureElements variant="breeze" density={0.5} tone="dark" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <Link href="#home" className="flex items-center gap-3 mb-6 text-white group">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-white">
                <Image
                  src="/images/logo.jpg"
                  alt="Kakkadampoyil Villas Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-playfair text-2xl font-semibold tracking-wide">
                Kakkadampoyil
                <span className="text-accent ml-1">Villas</span>
              </span>
            </Link>
            <p className="font-sans text-sm leading-relaxed mb-6 text-white/65">
              Three private villas above the clouds. Where Kerala's wild heart meets quiet luxury.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {["Instagram", "Facebook", "YouTube"].map((label) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-full glass hover:bg-accent hover:text-dark transition-all"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-playfair font-semibold text-base text-white mb-6 uppercase tracking-[0.18em] text-sm">
              Explore
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              {[
                ["Home", "#home"],
                ["Our Villas", "#villas"],
                ["Experiences", "#experiences"],
                ["Gallery", "#gallery"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-accent transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-playfair font-semibold text-base text-white mb-6 uppercase tracking-[0.18em] text-sm">
              Our Villas
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li><Link href="#villas" className="hover:text-accent transition-colors">Lux Villa</Link></li>
              <li><Link href="#villas" className="hover:text-accent transition-colors">Fortune Villa</Link></li>
              <li><Link href="#villas" className="hover:text-accent transition-colors">Munnas Villa</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair font-semibold text-base text-white mb-6 uppercase tracking-[0.18em] text-sm">
              Get in Touch
            </h4>
            <ul className="space-y-4 font-sans text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span className="text-white/65">Foggy Mountain Park Road, Kakkadampoyil, Kerala</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <a href="tel:+918589850641" className="hover:text-accent transition-colors">
                  +91 85898 50641
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <a href="mailto:contact@kakkadampoyilvillas.com" className="hover:text-accent transition-colors break-all">
                  contact@kakkadampoyilvillas.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-white/50">
          <p>© {currentYear} Kakkadampoyil Villas. All rights reserved.</p>
          <p>Crafted in the hills of Kerala</p>
        </div>
      </div>
    </footer>
  );
}
