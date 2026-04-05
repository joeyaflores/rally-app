import { ImageResponse } from "next/og";
import { getReportPageData } from "@/lib/reports";
import config from "@rally";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

// Cache fonts at module level — loaded once per process
let fontCache: { display: ArrayBuffer; stat: ArrayBuffer } | null = null;

async function getFonts() {
  if (fontCache) return fontCache;
  const [display, stat] = await Promise.all([
    fetch(new URL("../../../fonts/made-mirage-bold.otf", import.meta.url)).then(
      (r) => r.arrayBuffer()
    ),
    fetch(
      "https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9Wlhyw.woff2"
    ).then((r) => r.arrayBuffer()),
  ]);
  fontCache = { display, stat };
  return fontCache;
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [data, fonts] = await Promise.all([
    getReportPageData(token),
    getFonts(),
  ]);
  const { display: displayFont, stat: statFont } = fonts;

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: config.theme.primary,
            color: "white",
            fontFamily: "Display",
            fontSize: 48,
          }}
        >
          Report not found
        </div>
      ),
      {
        ...size,
        fonts: [
          { name: "Display", data: displayFont, style: "normal", weight: 700 },
        ],
      }
    );
  }

  const { report, attendance } = data;
  const date = new Date(report.event_date + "T00:00:00");
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: config.theme.primary,
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 380,
            height: 380,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.025)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -80,
            width: 440,
            height: 440,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "55%",
            right: "8%",
            width: 260,
            height: 260,
            borderRadius: "50%",
            backgroundColor: "rgba(255,107,53,0.04)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "56px 72px",
            flex: 1,
            position: "relative",
          }}
        >
          {/* Top: club name + badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontFamily: "Display",
                fontSize: 22,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.03em",
              }}
            >
              {config.fullName.toLowerCase()}
            </div>
            <div
              style={{
                fontFamily: "Stat",
                fontSize: 13,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999,
                padding: "6px 18px",
              }}
            >
              event report
            </div>
          </div>

          {/* Middle: title + date */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 40,
            }}
          >
            <div
              style={{
                fontFamily: "Display",
                fontSize: 64,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              {report.title}
            </div>
            <div
              style={{
                fontFamily: "Stat",
                fontSize: 16,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginTop: 12,
              }}
            >
              {dateStr}
              {report.location ? ` · ${report.location}` : ""}
            </div>
          </div>

          {/* Bottom: big number */}
          {attendance ? (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 20,
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  fontFamily: "Stat",
                  fontSize: 160,
                  lineHeight: 1,
                  letterSpacing: "0.03em",
                  color: config.theme.accent,
                }}
              >
                {attendance.total}
              </div>
              <div
                style={{
                  fontFamily: "Display",
                  fontSize: 32,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.01em",
                  paddingBottom: 18,
                }}
              >
                {config.terms.member} showed up
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "auto" }} />
          )}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            height: 5,
            background: `linear-gradient(to right, ${config.theme.accent}, ${config.theme.gold}, ${config.theme.accent})`,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Display", data: displayFont, style: "normal", weight: 700 },
        { name: "Stat", data: statFont, style: "normal", weight: 400 },
      ],
    }
  );
}
