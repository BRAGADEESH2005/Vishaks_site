import { ButtonLink } from "@/components/ui/ArrowLink";
import { HeroStage } from "./HeroStage";

export function Hero() {
  return (
    <HeroStage>
      <div className="max-w-[46rem]">
        <p
          data-hero-in
          className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-ivory/20 bg-ink/45 px-3.5 py-2 text-[0.72rem] font-medium uppercase leading-snug tracking-[0.14em] text-ivory/95 backdrop-blur-md sm:px-4 sm:text-[0.78rem] md:border-0 md:bg-transparent md:p-0 md:font-mono md:font-normal md:tracking-[0.18em] md:text-ivory/75 md:backdrop-blur-none"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-bronze-light" />
          <span>Chennai · Residential and commercial development</span>
        </p>
        <h1 data-hero-in className="mt-5 text-[clamp(2.65rem,12.5vw,3.6rem)] leading-[0.98] tracking-[-0.01em] [text-shadow:0_2px_24px_rgb(21_17_14/0.45)] md:mt-6 md:text-display-xl md:[text-shadow:none]">
          Where Chennai <em className="italic text-bronze-light">grows</em> next.
        </h1>
        <p data-hero-in className="mt-5 max-w-[34rem] text-[1.02rem] leading-relaxed text-ivory/85 md:mt-7 md:text-lede md:text-ivory/80">
          Residential plots, residential towers, commercial buildings and Grade A offices, planned along the corridors where
          the city is moving.
        </p>
        <div data-hero-in className="mt-7 grid grid-cols-1 gap-2.5 min-[400px]:flex min-[400px]:flex-wrap md:mt-10 md:gap-3">
          <ButtonLink href="/#developments">Explore Our Developments</ButtonLink>
          <ButtonLink href="/#vision" variant="outline">
            Discover Our Vision
          </ButtonLink>
        </div>
      </div>
    </HeroStage>
  );
}
