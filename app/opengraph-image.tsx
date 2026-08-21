import { ImageResponse } from "next/og";

// No static brand image exists anywhere in this project (public/ is empty —
// the marketing UI is built from inline icon components, not image files),
// so the OG/Twitter share image is generated on the fly instead of
// requiring a designed asset. Next.js auto-detects this file and wires it
// into both `openGraph.images` and `twitter.images` in app/layout.tsx's
// metadata without any manual reference needed.
export const runtime = "edge";
export const alt = "IELTS Pathway — Free IELTS Practice Tests & Mock Exams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Echoes BrandLogo.tsx's navy-badge-with-cyan-checkpoint-dot mark and
// palette — satori (next/og's renderer) only supports a div/CSS subset,
// not arbitrary inline SVG paths, so the badge is approximated here as a
// rounded square with a dot rather than the full ascending-line glyph.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1b2a4a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: "#25395f",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              display: "flex",
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "#00b4d8",
            }}
          />
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, color: "#ffffff", textAlign: "center" }}>
          IELTS Pathway
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#9ca3af", marginTop: 20, textAlign: "center" }}>
          Full-length mock tests with real band scoring
        </div>
      </div>
    ),
    { ...size }
  );
}
