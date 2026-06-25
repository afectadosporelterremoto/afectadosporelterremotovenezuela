import React from "react";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon" | "badge";
  height?: number;
}

export default function Logo({ className = "", variant = "full", height = 40 }: LogoProps) {
  // Colores del logotipo oficial:
  // Azul oscuro (manos y texto): #002F6C
  // Rojo (TERREMOTO): #C0392B (o #D32F2F)
  // Amarillo (Franja superior de bandera): #F2C94C
  // Blanco: #FFFFFF

  // Estrella SVG básica para reutilizar
  const renderStar = (x: number, y: number) => (
    <polygon
      key={`${x}-${y}`}
      points="0,-2.5 0.7,-0.7 2.5,-0.7 1,0.5 1.5,2.3 0,1.2 -1.5,2.3 -1,0.5 -2.5,-0.7 -0.7,-0.7"
      fill="#FFFFFF"
      transform={`translate(${x}, ${y}) scale(0.85)`}
    />
  );

  const renderIsotype = () => (
    <svg
      viewBox="0 0 100 100"
      height={height}
      width={height}
      className="inline-block shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ClipPath para cortar la bandera en forma de corazón */}
        <clipPath id="heart-clip">
          <path d="M50 83 C50 83 18 53 18 31 C18 17.5 32 17.5 50 32 C68 17.5 82 17.5 82 31 C82 53 50 83 50 83 Z" />
        </clipPath>
        
        {/* Silueta de la mano izquierda */}
        <path
          id="hand-path"
          d="M 40.5,62.5 
             C 38.5,62.5 35,62 33,60 
             26.5,53.5 22.5,43.5 22.5,29.5 
             C 22.5,28.5 23.5,28.5 24,29.5 
             C 27,35.5 31,43.5 35.5,49.5 
             C 32,38.5 29.5,32.5 29.5,29.5 
             C 29.5,28.5 30.5,28.5 31,29.5 
             C 34.5,36 38.5,45 42.5,51.5 
             C 40,39 39,33 39,31.5 
             C 39,30.5 40,30.5 40.5,31.5 
             C 43.5,38 47,45 49,50.5 
             C 48,41 47,35 47,34.5 
             C 47,33.5 48,33.5 48.5,34.5 
             C 51,40 53,45.5 54.5,50 Z"
        />
      </defs>

      {/* 1. Corazón con Bandera de Venezuela */}
      <g clipPath="url(#heart-clip)">
        {/* Amarillo (Arriba) */}
        <rect x="0" y="0" width="100" height="31" fill="#F2C94C" />
        
        {/* Azul (Centro) */}
        <path d="M 0,26 Q 50,42 100,26 L 100,50 Q 50,66 0,50 Z" fill="#002F6C" />
        
        {/* Rojo (Abajo) */}
        <rect x="0" y="44" width="100" height="40" fill="#C0392B" />

        {/* 8 Estrellas en Arco en la franja azul */}
        {renderStar(34, 39)}
        {renderStar(38, 35)}
        {renderStar(43, 33)}
        {renderStar(48, 32)}
        {renderStar(53, 32)}
        {renderStar(58, 33)}
        {renderStar(63, 35)}
        {renderStar(67, 39)}
      </g>

      {/* 2. Manos de ayuda que sostienen el corazón (Azul Oscuro) */}
      {/* Mano Izquierda */}
      <use href="#hand-path" fill="#002F6C" />
      {/* Mano Derecha (Simétrica) */}
      <use href="#hand-path" fill="#002F6C" transform="translate(100, 0) scale(-1, 1)" />
    </svg>
  );

  // Variante: Badge Circular Grande (Estilo Sello Oficial)
  if (variant === "badge") {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-4 bg-white rounded-full border border-gray-150 shadow-md ${className}`}>
        {renderIsotype()}
        <div className="mt-4 flex flex-col items-center space-y-1">
          <span className="text-[10px] font-bold text-[#002F6C] tracking-widest uppercase">
            Afectados por el
          </span>
          <span className="text-xl font-black text-[#C0392B] tracking-tight leading-none uppercase">
            Terremoto
          </span>
          <span className="text-xs font-semibold text-[#002F6C] tracking-widest uppercase flex items-center space-x-1.5">
            <span>—</span>
            <span>Venezuela</span>
            <span>—</span>
          </span>
        </div>
      </div>
    );
  }

  // Variante: Solo Icono
  if (variant === "icon") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {renderIsotype()}
      </div>
    );
  }

  // Variante: Logotipo Horizontal Completo para Header y Footer
  return (
    <div className={`flex items-center space-x-3.5 ${className}`}>
      {renderIsotype()}
      <div className="flex flex-col text-left justify-center">
        <span className="font-bold text-[10px] md:text-xs leading-none text-[#002F6C] tracking-widest uppercase">
          Afectados por el
        </span>
        <span className="font-black text-lg md:text-2xl leading-none text-[#C0392B] tracking-tighter uppercase my-0.5">
          Terremoto
        </span>
        <span className="font-bold text-[9px] md:text-xs leading-none text-[#002F6C] tracking-widest uppercase">
          — Venezuela —
        </span>
      </div>
    </div>
  );
}
