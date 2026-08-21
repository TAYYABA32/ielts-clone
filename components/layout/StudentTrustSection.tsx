import Image from "next/image";

// Real, verified Unsplash photos (IDs pulled from unsplash.com/s/photos and
// spot-checked before use) — generic candid study/classroom/library scenes,
// not staged portraits or testimonial-style shots naming specific people.
const GRID_PHOTOS = [
  "1571260899304-425eee4c7efc",
  "1522202176988-66273c2fd55f",
  "1543269865-cbf427effbad",
  "1522071820081-009f0129c71c",
  "1606761568499-6d2451b23c66",
  "1531545514256-b1400bc00f31",
  "1593698054469-2bb6fdf4b512",
  "1514369118554-e20d93546b30",
  "1652305500057-0fcb348b62aa",
  "1721702754494-fdd7189f946c",
  "1728455635901-bb16530faf40",
  "1669146894279-509f5de45390",
  "1690788210614-9052cffd8a14",
  "1620829813573-7c9e1877706f",
  "1460518451285-97b6aa326961",
  "1516321497487-e288fb19713f",
];

function unsplashUrl(id: string, size: number) {
  return `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=crop&q=60`;
}

// 4x4 grid of the same photo set as stacked CSS background layers, so the
// giant "OUR COMMUNITY" text can reveal them via background-clip: text —
// that technique needs one composited background, not separate <img> tags.
const TEXT_MASK_COLS = 4;
const textMaskLayers = GRID_PHOTOS.map((id, i) => {
  const col = i % TEXT_MASK_COLS;
  const row = Math.floor(i / TEXT_MASK_COLS);
  return {
    image: `url(${unsplashUrl(id, 400)})`,
    position: `${(col * 100) / (TEXT_MASK_COLS - 1)}% ${(row * 100) / (TEXT_MASK_COLS - 1)}%`,
  };
});

export function StudentTrustSection() {
  return (
    <section id="students" className="scroll-mt-32 relative overflow-hidden bg-gray-50 py-28 text-center md:py-40">
      {/* 1. Live CSS/HTML grid of real Unsplash photos, muted behind the content */}
      <div aria-hidden="true" className="absolute inset-0 grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8">
        {GRID_PHOTOS.concat(GRID_PHOTOS, GRID_PHOTOS).map((id, i) => (
          <div key={`${id}-${i}`} className="relative aspect-square w-full">
            <Image
              src={unsplashUrl(id, 200)}
              alt=""
              fill
              sizes="150px"
              className="object-cover opacity-25 grayscale"
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* 2. Text-masking effect: the same photo set shows in full color inside the glyphs */}
        <h2
          className="bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl md:text-8xl"
          style={{
            backgroundImage: textMaskLayers.map((l) => l.image).join(", "),
            backgroundPosition: textMaskLayers.map((l) => l.position).join(", "),
            backgroundSize: `${100 / TEXT_MASK_COLS}% ${100 / TEXT_MASK_COLS}%`,
            backgroundRepeat: "no-repeat",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          OUR COMMUNITY
        </h2>

        {/* 3. Subtitle, directly under the giant text */}
        <p className="mt-2 text-xl font-bold tracking-normal text-[#1b2a4a] md:text-2xl">of IELTS learners, growing every day</p>
      </div>
    </section>
  );
}
