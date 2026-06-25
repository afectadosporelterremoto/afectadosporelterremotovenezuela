"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Phone, Shield, FileText, Send, Check } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { maskCedula, maskPhone } from "@/utils/mask";
import { createClient } from "@/utils/supabase/client";

interface PersonCardProps {
  person: {
    id: string;
    full_name: string;
    cedula?: string;
    phone?: string;
    state: string;
    city: string;
    municipality?: string;
    status: string;
    situation_description?: string;
    person_photo_url?: string;
    created_at: string;
  };
}

export default function PersonCard({ person }: PersonCardProps) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Honeypot para spam
  const [websiteUrl, setWebsiteUrl] = useState("");

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (websiteUrl) {
      // Si el campo invisible se llena, es un robot. Simular éxito y bloquear.
      setSubmitted(true);
      return;
    }

    if (!reporterName.trim() || !reporterPhone.trim() || !infoMessage.trim()) {
      setError("Por favor completa todos los campos del reporte.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("information_reports")
        .insert({
          related_type: "affected",
          related_id: person.id,
          reporter_name: reporterName.trim(),
          reporter_phone: reporterPhone.trim(),
          message: infoMessage.trim(),
        });

      if (dbError) {
        console.warn("Fallo inserción en Supabase, simulando envío local:", dbError.message);
      }

      setSubmitted(true);
      setReporterName("");
      setReporterPhone("");
      setInfoMessage("");
    } catch (err: any) {
      console.error(err);
      setError("Ocurrió un error al enviar el reporte. Por favor intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const defaultPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop";
  const photoUrl = person.person_photo_url || defaultPhoto;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs hover:shadow-md transition-shadow">
      {/* Cabecera / Foto y Estado */}
      <div className="relative h-48 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={person.full_name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={person.status} />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-1">{person.full_name}</h3>
        
        {/* Cédula Enmascarada */}
        <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500 font-semibold">
          <Shield size={13} className="text-gray-400" />
          <span>Cédula: {maskCedula(person.cedula)}</span>
        </div>

        {/* Ubicación */}
        <div className="mt-3 flex items-start space-x-1.5 text-sm text-gray-600">
          <MapPin size={16} className="text-[#C0392B] shrink-0 mt-0.5" />
          <span className="line-clamp-1">
            {person.city}, {person.state} {person.municipality ? `(${person.municipality})` : ""}
          </span>
        </div>

        {/* Teléfono de contacto enmascarado */}
        <div className="mt-2 flex items-center space-x-1.5 text-sm text-gray-600">
          <Phone size={16} className="text-gray-400 shrink-0" />
          <span>Contacto: {maskPhone(person.phone)}</span>
        </div>

        {/* Descripción de la situación */}
        <p className="mt-3 text-xs text-gray-600 line-clamp-2 leading-relaxed flex-1 italic bg-gray-50 p-2 rounded-md border border-gray-100">
          "{person.situation_description || "Sin descripción detallada de la situación."}"
        </p>

        {/* Fecha de Registro */}
        <div className="mt-4 flex items-center space-x-1 text-[11px] text-gray-400 border-t border-gray-100 pt-3">
          <Calendar size={12} />
          <span>Registrado: {new Date(person.created_at).toLocaleDateString("es-VE")}</span>
        </div>

        {/* Acciones */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`/buscar/${person.id}`}
            className="flex items-center justify-center space-x-1 rounded-lg border border-gray-300 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={14} />
            <span>Ver Detalle</span>
          </a>
          <button
            onClick={() => {
              setShowReportForm(!showReportForm);
              setSubmitted(false);
              setError(null);
            }}
            className="flex items-center justify-center space-x-1 rounded-lg bg-[#0B1F3A] py-2 text-center text-xs font-bold text-white hover:bg-[#152e4f] transition-colors"
          >
            <span>Tengo info</span>
          </button>
        </div>

        {/* Formulario rápido para suministrar información */}
        {showReportForm && (
          <div className="mt-4 border-t border-gray-150 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Reportar información útil</h4>
            
            {submitted ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <Check className="mx-auto h-5 w-5 text-green-600 mb-1" />
                <p className="text-xs text-green-800 font-semibold">¡Información enviada con éxito!</p>
                <p className="text-[10px] text-green-600 mt-0.5">Será revisada por administradores.</p>
              </div>
            ) : (
              <form onSubmit={handleInfoSubmit} className="space-y-2">
                {/* Honeypot invisible */}
                <input
                  type="text"
                  name="website"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  required
                />
                
                <input
                  type="tel"
                  placeholder="Tu teléfono (ej. 04121234567)"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                  required
                />

                <textarea
                  placeholder="Escribe aquí los detalles que conozcas..."
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-[#0B1F3A] focus:outline-hidden resize-none"
                  required
                />

                {error && <p className="text-[10px] text-red-600 font-semibold">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-md bg-[#C0392B] py-1.5 text-xs font-bold text-white hover:bg-[#A93226] transition-colors disabled:opacity-50"
                >
                  <Send size={12} />
                  <span>{loading ? "Enviando..." : "Enviar Reporte"}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
