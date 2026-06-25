import React from "react";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  height?: number;
}

export default function Logo({ className = "", variant = "full", height = 40 }: LogoProps) {
  // Colores principales:
  // Azul oscuro: #0B1F3A
  // Rojo ayuda: #C0392B
  // Dorado: #F2C94C
  // Gris suave: #7F8C8D
  
  // Icono estilizado: Isotipo (Mapa simplificado + Corazón + Pin de ubicación)
  const renderIsotype = () => (
    <svg
      viewBox="0 0 100 100"
      height={height}
      width={height}
      className="inline-block"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Silueta geométrica y abstracta del mapa de Venezuela */}
      <path
        d="M20 45C23 41 28 39 33 39C38 39 42 35 46 36C50 37 54 41 58 40C62 39 67 33 72 32C77 31 82 34 85 36C88 38 87 43 83 46C79 49 76 52 75 56C74 60 77 64 74 67C71 70 65 67 61 68C57 69 54 74 50 75C46 76 43 72 40 70C37 68 34 68 31 69C28 70 25 73 22 72C19 71 19 66 17 62C15 58 13 54 15 50C17 46 17 49 20 45Z"
        fill="#0B1F3A"
        fillOpacity="0.12"
        stroke="#0B1F3A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Pin de localización */}
      <path
        d="M50 20C42.8 20 37 25.8 37 33C37 42.8 50 58 50 58C50 58 63 42.8 63 33C63 25.8 57.2 20 50 20Z"
        fill="#0B1F3A"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      
      {/* Corazón en el centro del pin de ubicación ( Esperanza / Ayuda ) */}
      <path
        d="M50 38.3C49.7 38.3 49.5 38.2 49.3 38.0C48.4 37.1 46.5 35.5 45.4 34.2C44.2 32.8 43.5 31.5 43.5 30.1C43.5 28.0 45.1 26.3 47.1 26.3C48.3 26.3 49.4 27.0 50 28.0C50.6 27.0 51.7 26.3 52.9 26.3C54.9 26.3 56.5 28.0 56.5 30.1C56.5 31.5 55.8 32.8 54.6 34.2C53.5 35.5 51.6 37.1 50.7 38.0C50.5 38.2 50.3 38.3 50 38.3Z"
        fill="#C0392B"
      />
      
      {/* Mano de apoyo/resguardo estilizada en la base del mapa */}
      <path
        d="M32 75C36 78 44 80 50 80C58 80 65 77 69 73M28 65C34 68 40 70 48 70C58 70 66 66 70 62"
        stroke="#F2C94C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {renderIsotype()}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {renderIsotype()}
      <div className="flex flex-col text-left">
        <span className="font-bold text-sm md:text-base leading-tight text-[#0B1F3A] tracking-wide uppercase">
          Afectados por el Terremoto
        </span>
        <span className="font-medium text-xs md:text-sm text-[#C0392B] tracking-wider uppercase">
          Venezuela
        </span>
      </div>
    </div>
  );
}
