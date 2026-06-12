import { ImageResponse } from "next/og";

export const alt = "HRUSHE | Defined Quietly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f2f0eb",
          color: "#111111",
          padding: "62px 72px",
          border: "18px solid #111111",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          <span>Modern minimal streetwear</span>
          <span>India</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, lineHeight: 0.9, letterSpacing: "-0.07em" }}>
            HRUSHE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 34,
              fontSize: 34,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ width: 92, height: 3, background: "#111111" }} />
            <span>Defined Quietly</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span>Quiet pieces. Everyday ease.</span>
          <span>hrushe.in</span>
        </div>
      </div>
    ),
    size
  );
}
