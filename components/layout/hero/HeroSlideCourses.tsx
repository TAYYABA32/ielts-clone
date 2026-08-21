import { HeroButton } from "./HeroButton";
import { HeroImageCard } from "./HeroImageCard";

/** Slide 3 — matches the reference's courses/breakthrough layout: heading + caption + single Start Now CTA + banner image. */
export function HeroSlideCourses() {
  return (
    <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-semibold leading-[1.15] text-[#1b2a4a] sm:text-4xl lg:text-[42px]">
          <span className="font-extrabold uppercase text-[#00b4d8]">Breakthrough</span> your band score with our{" "}
          <span className="font-extrabold uppercase text-[#00b4d8]">Specialized</span> IELTS courses
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#505050] lg:mx-0">
          Ready to boost your IELTS score?
        </p>

        <div className="mt-8 flex justify-center lg:justify-start">
          <HeroButton href="/collection" variant="solid">
            Start Now
          </HeroButton>
        </div>
      </div>

      <HeroImageCard
        src="/images/instructor-3.jpeg"
        alt="An IELTS instructor"
        cards={[
          {
            position: "top-4 right-2 w-40 sm:-right-4",
            content: <p className="text-xs font-semibold leading-snug text-[#1b2a4a]">Certified IELTS Instructors</p>,
          },
        ]}
      />
    </div>
  );
}
