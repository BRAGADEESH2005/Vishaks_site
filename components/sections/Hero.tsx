import { ButtonLink } from "@/components/ui/ArrowLink";
import { HeroStage } from "./HeroStage";

export function Hero() {
  return (
    <HeroStage>
      <div className="max-w-[46rem]">
        <p data-hero-in className="label text-ivory/70">
          Chennai · Residential and commercial development
        </p>
        <h1 data-hero-in className="mt-6 text-display-xl">
          Where Chennai <em className="italic text-bronze-light">grows</em> next.
        </h1>
        <p data-hero-in className="mt-7 max-w-[34rem] text-lede text-ivory/80">
          Residential plots, residential towers, commercial buildings and Grade A offices, planned along the corridors where
          the city is moving.
        </p>
        <div data-hero-in className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/#developments">Explore Our Developments</ButtonLink>
          <ButtonLink href="/#vision" variant="outline">
            Discover Our Vision
          </ButtonLink>
        </div>
      </div>
    </HeroStage>
  );
}
