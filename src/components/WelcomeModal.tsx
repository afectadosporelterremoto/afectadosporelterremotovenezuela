"use client";

import React, { useState, useEffect } from "react";
import { X, Heart, ShieldAlert } from "lucide-react";
import Logo from "./Logo";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificar en localStorage si ya se ha mostrado el modal
    const hasSeen = localStorage.getItem("terremoto_venezuela_welcome_seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("terremoto_venezuela_welcome_seen", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con desenfoque de fondo */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white border border-gray-150 p-6 md:p-8 text-center shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Botón de cierre en esquina */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Logotipo badge circular */}
        <div className="mx-auto flex justify-center mb-6">
          <Logo variant="badge" className="shadow-none border-0 !p-0" height={90} />
        </div>

        {/* Título de solidaridad */}
        <h2 className="text-xl md:text-2xl font-black text-[#0B1F3A] tracking-tight uppercase">
          Unidos por Venezuela
        </h2>

        {/* Mensaje de apoyo */}
        <div className="mt-4 space-y-4">
          <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed">
            En respuesta al devastador sismo que ha afectado a nuestro país, hemos habilitado esta plataforma humanitaria para el registro y la localización de ciudadanos.
          </p>
          <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed">
            Expresamos nuestro más sentido pésame y condolencias a todas las familias que han perdido seres queridos en este trágico suceso. Su dolor es el dolor de toda una nación.
          </p>
        </div>

        {/* Alerta de privacidad/responsabilidad */}
        <div className="mt-6 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-left">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-normal">
            <strong>Aviso de Privacidad:</strong> Los datos de contacto, cédulas y direcciones se mantienen encriptados y ocultos para uso exclusivo de búsqueda directa, protegiendo la seguridad de todos.
          </p>
        </div>

        {/* Acciones del Modal */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-lg bg-[#C0392B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A93226] transition-colors shadow-md shadow-black/10"
          >
            <Heart size={16} className="fill-white" />
            <span>Entrar a la Plataforma</span>
          </button>
        </div>
      </div>
    </div>
  );
}
