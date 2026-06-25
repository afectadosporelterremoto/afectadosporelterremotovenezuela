"use client";

import React, { useState } from "react";
import { registerMissingPerson } from "@/app/actions";
import ImageUpload from "./ImageUpload";
import PrivacyNotice from "./PrivacyNotice";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function MissingPersonForm() {
  const [fullName, setFullName] = useState("");
  const [cedula, setCedula] = useState("");
  const [approximateAge, setApproximateAge] = useState<number | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [physicalDescription, setPhysicalDescription] = useState("");
  const [clothesDescription, setClothesDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [lastContactAt, setLastContactAt] = useState("");
  const [notes, setNotes] = useState("");
  
  // Honeypot
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("El nombre de la persona desaparecida es requerido.");
    if (!lastSeenLocation.trim()) return setError("El lugar donde fue vista por última vez es requerido.");
    if (!reporterName.trim()) return setError("Tu nombre es requerido.");
    if (!reporterPhone.trim()) return setError("Tu teléfono de contacto es requerido.");

    setLoading(true);

    try {
      const res = await registerMissingPerson({
        fullName,
        cedula,
        approximateAge,
        photoUrl,
        lastSeenLocation,
        physicalDescription,
        clothesDescription,
        reporterName,
        reporterPhone,
        lastContactAt,
        notes,
        websiteHoneypot,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        // Reset
        setFullName("");
        setCedula("");
        setApproximateAge(undefined);
        setPhotoUrl("");
        setLastSeenLocation("");
        setPhysicalDescription("");
        setClothesDescription("");
        setReporterName("");
        setReporterPhone("");
        setLastContactAt("");
        setNotes("");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al enviar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-xs">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-3" />
        <h3 className="text-xl font-bold text-green-900">Reporte de Desaparecido Creado</h3>
        <p className="text-sm text-green-700 mt-2 max-w-md mx-auto">
          El reporte ha sido agregado exitosamente. Esta información ayudará a voluntarios, rescatistas y familiares en la búsqueda activa.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors"
        >
          Crear otro reporte
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs max-w-3xl mx-auto">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={websiteHoneypot}
        onChange={(e) => setWebsiteHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900 md:text-xl">Reportar Persona Desaparecida</h2>
        <p className="text-xs text-gray-500 mt-1">Suministra la mayor cantidad de información y detalles físicos para facilitar la búsqueda activa.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start space-x-2 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Datos Personales */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-[#0B1F3A] pl-2">
          1. Información de la Persona Desaparecida
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="miss-name" className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo *</label>
            <input
              id="miss-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Carmen Elena Rodríguez"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="miss-age" className="block text-sm font-semibold text-gray-700 mb-1">Edad Aproximada</label>
            <input
              id="miss-age"
              type="number"
              value={approximateAge || ""}
              onChange={(e) => setApproximateAge(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ej. 35"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="miss-cedula" className="block text-sm font-semibold text-gray-700 mb-1">Cédula (Si se conoce)</label>
            <input
              id="miss-cedula"
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej. V-15678901"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="miss-location" className="block text-sm font-semibold text-gray-700 mb-1">Última Ubicación o Zona Vista *</label>
            <input
              id="miss-location"
              type="text"
              required
              value={lastSeenLocation}
              onChange={(e) => setLastSeenLocation(e.target.value)}
              placeholder="Ej. Sector El Limón, callejón Carabobo, Maracay"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="miss-physical" className="block text-sm font-semibold text-gray-700 mb-1">Descripción Física</label>
            <textarea
              id="miss-physical"
              value={physicalDescription}
              onChange={(e) => setPhysicalDescription(e.target.value)}
              rows={3}
              placeholder="Estatura, contextura, color de piel, cabello, ojos, señas particulares, lunares, cicatrices o tatuajes."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden resize-none"
            />
          </div>

          <div>
            <label htmlFor="miss-clothes" className="block text-sm font-semibold text-gray-700 mb-1">Ropa que llevaba puesta</label>
            <textarea
              id="miss-clothes"
              value={clothesDescription}
              onChange={(e) => setClothesDescription(e.target.value)}
              rows={3}
              placeholder="Color de camisa/franela, pantalón, calzado u otros accesorios que portaba."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden resize-none"
            />
          </div>
        </div>

        <div>
          <ImageUpload onUploadComplete={setPhotoUrl} label="Subir Foto Reciente (Opcional)" placeholder="Foto de la persona" />
        </div>
      </div>

      {/* Datos del Familiar / Reportante */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-[#0B1F3A] pl-2">
          2. Información del Familiar o Contacto de Búsqueda
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rep-name" className="block text-sm font-semibold text-gray-700 mb-1">Tu Nombre Completo *</label>
            <input
              id="rep-name"
              type="text"
              required
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Familiar directo o allegado"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="rep-phone" className="block text-sm font-semibold text-gray-700 mb-1">Tu Teléfono de Contacto *</label>
            <input
              id="rep-phone"
              type="tel"
              required
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
              placeholder="Número de contacto activo"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="rep-lasttime" className="block text-sm font-semibold text-gray-700 mb-1">Fecha/Hora Último Contacto</label>
            <input
              id="rep-lasttime"
              type="datetime-local"
              value={lastContactAt}
              onChange={(e) => setLastContactAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label htmlFor="rep-notes" className="block text-sm font-semibold text-gray-700 mb-1">Observaciones adicionales</label>
          <textarea
            id="rep-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Cualquier información adicional que pueda ser relevante..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden resize-none"
          />
        </div>
      </div>

      <div className="pt-4">
        <PrivacyNotice />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-[#0B1F3A] py-3 text-base font-bold text-white hover:bg-[#152e4f] transition-colors sm:w-auto sm:px-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Publicando reporte...</span>
            </>
          ) : (
            <span>Reportar Desaparecido</span>
          )}
        </button>
      </div>
    </form>
  );
}
