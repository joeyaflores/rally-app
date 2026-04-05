import { ImageResponse } from "next/og";
import config from "@rally";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: config.theme.primary,
          borderRadius: "36px",
          fontSize: 100,
        }}
      >
        <span style={{ color: "white", fontWeight: 700, fontFamily: "sans-serif" }}>{config.appleIconLetter}</span>
      </div>
    ),
    { ...size }
  );
}
