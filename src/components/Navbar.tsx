"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Villas", href: "#villas" },
    { name: "Experiences", href: "#experiences" },
    { name: "Gallery", href: "#gallery" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "glass-strong shadow-warm py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="#home" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 md:w-12 md:h-12 bg-white rounded-full p-1 shadow-warm overflow-hidden flex items-center justify-center border border-primary/10">
            <Image src="/images/logo.jpg" alt="Kakkadampoyil Villas Logo" fill className="object-contain rounded-full" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className={clsx(
                "font-playfair text-lg md:text-xl font-semibold tracking-wide transition-colors",
                isScrolled ? "text-dark" : "text-white drop-shadow"
              )}
            >
              Kakkadampoyil
            </span>
            <span
              className={clsx(
                "text-[10px] uppercase tracking-[0.3em] mt-1 transition-colors",
                isScrolled ? "text-primary" : "text-accent-soft"
              )}
            >
              Villas · Kerala
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                "text-sm font-medium transition-colors hover:text-primary relative group",
                isScrolled ? "text-dark/80" : "text-white/90 drop-shadow"
              )}
            >
              {link.name}
              <span className={clsx(
                "absolute -bottom-1 left-0 w-0 h-px transition-all group-hover:w-full",
                isScrolled ? "bg-primary" : "bg-accent-soft"
              )} />
            </Link>
          ))}
          <Link
            href="#contact"
            className="bg-accent text-dark px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-[1.04] hover:bg-accent-soft shadow-warm flex items-center gap-1.5"
          >
            <Leaf className="w-3.5 h-3.5" />
            Book Now
          </Link>
        </nav>

        <button
          className={clsx(
            "md:hidden p-2 rounded-md",
            isScrolled ? "text-dark" : "text-white"
          )}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-fog flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-12">
              <Link href="#home" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/20 bg-white">
                  <Image src="/images/logo.jpg" alt="Kakkadampoyil Villas Logo" fill className="object-contain" />
                </div>
                <span className="font-playfair text-xl font-semibold text-dark">Kakkadampoyil Villas</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-dark" aria-label="Close menu">
                <X className="w-7 h-7" />
              </button>
            </div>

            <nav className="flex flex-col gap-6 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-2xl font-playfair text-dark hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="#contact"
                className="mt-8 bg-accent text-dark px-8 py-4 rounded-full font-semibold text-lg shadow-leaf w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book Now
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
