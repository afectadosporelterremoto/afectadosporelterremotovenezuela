import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0B1F3A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "100px",
                height: "100px",
                border: "1px solid white",
                boxSizing: "border-box",
              }}
            />
          ))}
        </div>

        {/* Top Section - Brand and Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Isotype */}
            <svg
              width="90"
              height="90"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ background: "white", borderRadius: "50%", padding: "5px", marginRight: "20px" }}
            >
              <path d="M 50 10 A 40 40 0 0 1 90 50 L 10 50 A 40 40 0 0 1 50 10 Z" fill="#F2C94C" />
              <rect x="10" y="40" width="80" height="20" fill="#002F6C" />
              <path d="M 10 50 A 40 40 0 0 0 90 50 L 90 60 A 40 40 0 0 1 10 60 Z" fill="#002F6C" />
              <path d="M 50 90 A 40 40 0 0 1 10 50 L 90 50 A 40 40 0 0 1 50 90 Z" fill="#C0392B" />
              <path
                d="M50 83 C50 83 18 53 18 31 C18 17.5 32 17.5 50 32 C68 17.5 82 17.5 82 31 C82 53 50 83 50 83 Z"
                fill="none"
                stroke="#002F6C"
                strokeWidth="7"
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "3px", color: "#F2C94C", textTransform: "uppercase" }}>
                Afectados por el
              </span>
              <h1 style={{ fontSize: "38px", fontWeight: "900", color: "white", margin: "2px 0 0 0", textTransform: "uppercase", lineHeight: "1" }}>
                Terremoto
              </h1>
              <span style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "3px", color: "#F2C94C", textTransform: "uppercase" }}>
                — Venezuela —
              </span>
            </div>
          </div>
          
          <div
            style={{
              padding: "8px 20px",
              background: "#C0392B",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Plataforma Humanitaria
          </div>
        </div>

        {/* Center Section - Slogan and Details */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 10, maxWidth: "800px", margin: "40px 0" }}>
          <h2 style={{ fontSize: "42px", fontWeight: "800", color: "white", lineHeight: "1.2", margin: "0 0 16px 0" }}>
            Portal Oficial de Localización, Registro y Ayuda Ciudadana
          </h2>
          <p style={{ fontSize: "20px", color: "#BACADA", margin: 0, lineHeight: "1.5" }}>
            Ayuda a localizar familiares, registrar personas afectadas o reportar ciudadanos rescatados. Accede a contactos de emergencia regionales y nacionales.
          </p>
        </div>

        {/* Bottom Section - Features & Domain */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "30px",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", gap: "40px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: "8px", height: "8px", background: "#F2C94C", borderRadius: "50%", marginRight: "10px" }} />
              <span style={{ fontSize: "16px", fontWeight: "bold", color: "#BACADA" }}>Búsqueda de Desaparecidos</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: "8px", height: "8px", background: "#C0392B", borderRadius: "50%", marginRight: "10px" }} />
              <span style={{ fontSize: "16px", fontWeight: "bold", color: "#BACADA" }}>Reporte de Rescatados</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: "8px", height: "8px", background: "#2ECC71", borderRadius: "50%", marginRight: "10px" }} />
              <span style={{ fontSize: "16px", fontWeight: "bold", color: "#BACADA" }}>Contactos de Emergencia</span>
            </div>
          </div>

          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#F2C94C", letterSpacing: "1px" }}>
            afectadosporelterremotovenezuela.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
