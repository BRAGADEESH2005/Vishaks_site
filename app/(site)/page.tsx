import { ArchitecturalStory } from "@/components/sections/ArchitecturalStory";
import { Credibility } from "@/components/sections/Credibility";
import { Enquiry } from "@/components/sections/Enquiry";
import { Hero } from "@/components/sections/Hero";
import { Introduction } from "@/components/sections/Introduction";
import { CommercialPortfolio, ResidentialPortfolio, SignatureDevelopments } from "@/components/sections/Portfolio";
import { MotionScope } from "@/components/ui/MotionScope";

export default function HomePage() {
  return (
    <main id="main">
      <MotionScope>
        <Hero />
        <Introduction />
        <SignatureDevelopments />
        <ResidentialPortfolio />
        <CommercialPortfolio />
        <ArchitecturalStory />
        <Credibility />
        <Enquiry />
      </MotionScope>
    </main>
  );
}
