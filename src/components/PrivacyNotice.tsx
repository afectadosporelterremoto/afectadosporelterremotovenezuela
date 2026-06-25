import React from "react";
import { Shield, EyeOff, Lock } from "lucide-react";

export default function PrivacyNotice() {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 shadow-2xs">
      <div className="flex items-start space-x-3">
        <Shield className="mt-0.5 h-5 w-5 text-[#0B1F3A] shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#0B1F3A]">Aviso de Privacidad y Manejo de Datos</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            La información suministrada en esta plataforma se trata con máxima responsabilidad y con fines estrictamente humanitarios de búsqueda y rescate. 
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-100/55">
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-500">
              <EyeOff size={12} className="text-[#C0392B]" />
              <span>Cédula y teléfono público ocultos parcialmente.</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-500">
              <Lock size={12} className="text-[#0B1F3A]" />
              <span>Dirección exacta visible solo para administradores.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
