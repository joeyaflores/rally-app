import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import { getUnboundedFont } from "@/lib/og-fonts";
import config from "@rally";

export const alt = config.fullName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

let mascotCache: string | null = null;

async function getMascotSrc(): Promise<string> {
  if (mascotCache) return mascotCache;
  const buf = await readFile(join(process.cwd(), "public/logo-mascot.png"));
  mascotCache = `data:image/png;base64,${buf.toString("base64")}`;
  return mascotCache;
}

export default async function Image() {
  const [fontData, mascotSrc] = await Promise.all([
    getUnboundedFont(),
    getMascotSrc(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          background: config.theme.primary,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Unbounded",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <img src={mascotSrc} width={140} height={175} style={{ objectFit: "contain" }} />
          <div
            style={{
              fontSize: 80,
              color: "white",
              letterSpacing: "-0.02em",
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {config.name}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            {config.location}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Unbounded",
          data: fontData,
          style: "normal",
          weight: 900,
        },
      ],
    }
  );
}
