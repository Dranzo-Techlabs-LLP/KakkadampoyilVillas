"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Navigation2, MessageCircle, Plane, Car } from "lucide-react";

export default function LocationSection() {
  const distances = [
    { icon: Car, label: "Calicut", value: "45 min" },
    { icon: Car, label: "Coimbatore", value: "2.5 hr" },
    { icon: Plane, label: "CCJ Airport", value: "1 hr" },
  ];

  return (
    <section className="relative py-28 bg-gradient-to-b from-fog via-mist to-fog overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 md:px-12 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 mb-5 text-primary text-sm font-medium uppercase tracking-[0.25em]">
              <span className="w-8 h-px bg-primary" />
              Find Us
            </div>
            <h2 className="text-4xl md:text-6xl font-playfair text-dark mb-6 leading-[1.05] text-balance">
              Hidden, but <em className="text-primary not-italic">never far</em>.
            </h2>
            <p className="text-dark/70 font-sans text-lg mb-10 leading-relaxed text-balance">
              Tucked into the misty hills of Kakkadampoyil, our villas are perfectly secluded —
              yet only a short drive from Kerala's main hubs.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-10">
              {distances.map((d) => (
                <div
                  key={d.label}
                  className="bg-white rounded-2xl p-4 shadow-warm border border-mist/60 text-center"
                >
                  <d.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="font-playfair font-semibold text-dark text-lg">
                    {d.value}
                  </div>
                  <div className="text-xs text-dark/60 uppercase tracking-wider">
                    from {d.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl gradient-leaf flex items-center justify-center text-white shrink-0 shadow-leaf">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-playfair font-semibold text-dark text-lg">Address</h4>
                  <p className="text-dark/70 font-sans">
                    Foggy Mountain Park Road, Kakkadampoyil, Kerala
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl gradient-leaf flex items-center justify-center text-white shrink-0 shadow-leaf">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-playfair font-semibold text-dark text-lg">Talk to us</h4>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <a href="tel:+918589850641" className="text-dark/70 hover:text-primary transition-colors">
                      +91 85898 50641
                    </a>
                    <a
                      href="https://wa.me/918589850641"
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 font-medium flex items-center gap-1.5 hover:underline w-fit"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl gradient-leaf flex items-center justify-center text-white shrink-0 shadow-leaf">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-playfair font-semibold text-dark text-lg">Email</h4>
                  <a
                    href="mailto:enquiry@kakkadampoyilvillas.com"
                    className="text-dark/70 hover:text-primary transition-colors"
                  >
                    enquiry@kakkadampoyilvillas.com
                  </a>
                </div>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/SyJfCz4hCoQQbAxg9"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-medium shadow-leaf hover:bg-dark transition-colors w-fit"
            >
              <Navigation2 className="w-5 h-5" />
              Get Directions
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[500px] lg:h-auto rounded-[2rem] overflow-hidden shadow-leaf border-[6px] border-white"
          >
            <iframe
              title="Kakkadampoyil Location"
              src="https://maps.google.com/maps?q=11.3339338,76.1167498&z=15&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[500px]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
