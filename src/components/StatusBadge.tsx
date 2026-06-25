import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Traducir estados si vienen en inglés
  const getStatusConfig = (val: string) => {
    const s = val.toLowerCase().trim();
    switch (s) {
      // Estados de Afectados (en español)
      case "sin localizar":
      case "missing":
        return {
          label: "Sin Localizar",
          bg: "bg-red-50 text-red-700 border-red-200",
        };
      case "localizado":
      case "located":
        return {
          label: "Localizado",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "rescatado":
      case "rescued":
        return {
          label: "Rescatado",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "hospitalizado":
      case "hospitalized":
        return {
          label: "Hospitalizado",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "fallecido":
      case "deceased":
        return {
          label: "Fallecido",
          bg: "bg-gray-100 text-gray-700 border-gray-300",
        };
      case "necesita ayuda":
        return {
          label: "Necesita Ayuda",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
        };
      default:
        return {
          label: val,
          bg: "bg-gray-50 text-gray-700 border-gray-200",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide ${config.bg}`}
    >
      {config.label}
    </span>
  );
}
