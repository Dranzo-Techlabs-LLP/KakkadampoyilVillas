"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import NatureElements from "./NatureElements";

const formSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  villa: z.string().min(1, "Pick a villa or 'Not Sure Yet'"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.string().min(1, "How many guests?"),
  requests: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ContactSection() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(formSchema), mode: "onBlur" });

  const onSubmit = async (data: FormData) => {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to send enquiry");
      }
      setStatus("success");
      reset();
      setTimeout(() => setStatus("idle"), 7000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <section id="contact" className="relative py-28 bg-gradient-to-b from-fog to-mist overflow-hidden">
      <NatureElements variant="leaves" density={0.7} tone="light" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 mb-5 text-primary text-sm font-medium uppercase tracking-[0.25em]">
            <span className="w-8 h-px bg-primary" />
            Plan Your Stay
            <span className="w-8 h-px bg-primary" />
          </div>
          <h2 className="text-4xl md:text-6xl font-playfair text-dark mb-5 leading-[1.05] text-balance">
            Tell us about your <em className="text-primary not-italic">getaway</em>.
          </h2>
          <p className="text-dark/65 font-sans text-lg leading-relaxed text-balance">
            Send your dates and we'll reply within 12 hours with availability,
            pricing, and a custom welcome plan.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2 bg-dark text-white rounded-3xl p-8 md:p-10 shadow-leaf relative overflow-hidden flex flex-col"
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-soft/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-6 text-accent-soft text-xs uppercase tracking-[0.25em] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Direct Booking
              </div>
              <h3 className="font-playfair text-3xl md:text-4xl mb-4 leading-tight">
                Skip the agents.
                <br />
                <em className="text-accent-soft not-italic">Talk to us directly.</em>
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-8">
                Booking direct gets you the best rate, full villa privacy, and
                early access to seasonal experiences.
              </p>

              <div className="space-y-4 mb-10">
                <a
                  href="tel:+918589850641"
                  className="group flex items-center gap-3 text-sm hover:text-accent transition-colors"
                >
                  <span className="w-10 h-10 rounded-2xl glass flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Call</span>
                    +91 85898 50641
                  </span>
                </a>
                <a
                  href="https://wa.me/918589850641"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 text-sm hover:text-accent transition-colors"
                >
                  <span className="w-10 h-10 rounded-2xl glass flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">WhatsApp</span>
                    Instant chat
                  </span>
                </a>
                <a
                  href="mailto:enquiry@kakkadampoyilvillas.com"
                  className="group flex items-center gap-3 text-sm hover:text-accent transition-colors"
                >
                  <span className="w-10 h-10 rounded-2xl glass flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="break-all">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Email</span>
                    enquiry@kakkadampoyilvillas.com
                  </span>
                </a>
              </div>

              <div className="mt-auto pt-6 border-t border-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
                  Reply window
                </p>
                <p className="font-playfair text-2xl">Within 12 hours</p>
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 bg-white rounded-3xl p-8 md:p-10 shadow-leaf border border-mist/60 min-w-0"
          >
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-20 h-20 rounded-full gradient-leaf text-white flex items-center justify-center mb-6 shadow-leaf">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="font-playfair text-3xl text-dark mb-3">Enquiry sent!</h3>
                <p className="text-dark/65 max-w-md leading-relaxed">
                  Thank you. Our team will reach out within 12 hours with availability,
                  pricing, and next steps.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-8 text-primary font-semibold border-b-2 border-primary/30 pb-1 hover:border-primary"
                >
                  Send another enquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full Name" error={errors.name?.message}>
                    <input
                      {...register("name")}
                      className={inputCls(!!errors.name)}
                      placeholder="John Doe"
                      autoComplete="name"
                    />
                  </Field>

                  <Field label="Phone" error={errors.phone?.message}>
                    <input
                      {...register("phone")}
                      type="tel"
                      className={inputCls(!!errors.phone)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Email" error={errors.email?.message} className="md:col-span-2">
                    <input
                      {...register("email")}
                      type="email"
                      className={inputCls(!!errors.email)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Field>

                  <Field label="Preferred Villa" error={errors.villa?.message}>
                    <select {...register("villa")} className={inputCls(!!errors.villa)}>
                      <option value="">Choose…</option>
                      <option value="Lux Villa">Lux Villa</option>
                      <option value="Fortune Villa">Fortune Villa</option>
                      <option value="Munnas Villa">Munnas Villa</option>
                      <option value="Not Sure Yet">Not Sure Yet</option>
                    </select>
                  </Field>

                  <Field label="Guests" error={errors.guests?.message}>
                    <input
                      {...register("guests")}
                      type="number"
                      min={1}
                      className={inputCls(!!errors.guests)}
                      placeholder="e.g. 4"
                    />
                  </Field>

                  <Field label="Check-in" error={errors.checkIn?.message}>
                    <input
                      {...register("checkIn")}
                      type="date"
                      className={inputCls(!!errors.checkIn)}
                    />
                  </Field>

                  <Field label="Check-out" error={errors.checkOut?.message}>
                    <input
                      {...register("checkOut")}
                      type="date"
                      className={inputCls(!!errors.checkOut)}
                    />
                  </Field>
                </div>

                <Field label="Special Requests (optional)">
                  <textarea
                    {...register("requests")}
                    rows={3}
                    className={`${inputCls(false)} resize-none`}
                    placeholder="Anniversaries, dietary needs, accessibility, anything else…"
                  />
                </Field>

                {status === "error" && (
                  <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMsg || "Something went wrong. Please try again."}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-semibold shadow-leaf hover:bg-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending your enquiry…
                    </>
                  ) : (
                    <>
                      Send Enquiry
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-dark/50 text-center">
                  By submitting, you agree to be contacted about your enquiry. We never share your details.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-3.5 rounded-2xl border bg-white text-dark placeholder:text-dark/35 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all ${
    hasError ? "border-red-400" : "border-mist"
  }`;
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-dark/70 uppercase tracking-[0.12em] mb-2">
        {label}
      </span>
      {children}
      {error && (
        <span className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </span>
      )}
    </label>
  );
}
