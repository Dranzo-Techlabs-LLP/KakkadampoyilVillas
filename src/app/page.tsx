import Hero from "@/components/Hero";
import AboutStrip from "@/components/AboutStrip";
import VillasSection from "@/components/VillasSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import GallerySection from "@/components/GallerySection";
import LocationSection from "@/components/LocationSection";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col w-full">
      <Hero />
      <AboutStrip />
      <VillasSection />
      <ExperiencesSection />
      <GallerySection />
      <LocationSection />
      <ContactSection />
    </main>
  );
}
