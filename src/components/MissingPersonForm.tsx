"use client";

import React, { useState } from "react";
import { registerMissingPerson, isCurrentUserAdmin, submitInformationReport } from "@/app/actions";
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

  // Estados para Duplicados
  const [duplicateData, setDuplicateData] = useState<any | null>(null);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [infoName, setInfoName] = useState("");
  const [infoPhone, setInfoPhone] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [submittingInfo, setSubmittingInfo] = useState(false);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError(null);
    setSubmittingInfo(true);

    let relatedType: "affected" | "missing" | "rescued" = "missing";
    if (duplicateData.type === "affected" || duplicateData.type === "hospitalizado") relatedType = "affected";
    else if (duplicateData.type === "rescatado") relatedType = "rescued";

    try {
      const res = await submitInformationReport({
        relatedType,
        relatedId: duplicateData.record.id,
        reporterName: infoName,
        reporterPhone: infoPhone,
        message: infoMessage,
      });

      if (res.error) {
        setInfoError(res.error);
      } else {
        setInfoSuccess(true);
        setInfoName("");
        setInfoPhone("");
        setInfoMessage("");
      }
    } catch (err) {
      setInfoError("Error al enviar la información.");
    } finally {
      setSubmittingInfo(false);
    }
  };

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

      if (res.error === "DUPLICATE_FOUND") {
        setDuplicateData({
          type: res.type,
          record: res.record,
          message: res.message,
        });
        const adminCheck = await isCurrentUserAdmin();
        setIsAdminUser(adminCheck);
        setError(null);
      } else if (res.error) {
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
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors"
        >
          Crear otro reporte
        </button>
      </div>
    );
  }

  if (duplicateData) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 md:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-black text-amber-900">Esta persona ya está registrada</h3>
            <p className="text-sm text-amber-755 mt-1 font-medium">
              {duplicateData.message || "Hemos encontrado un registro coincidente en nuestra base de datos."}
            </p>
            <div className="mt-3 inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">
              <span>Categoría: {
                duplicateData.type === "hospitalizado" ? "Hospitalizado/a" :
                duplicateData.type === "desaparecido" ? "Desaparecido/a" :
                duplicateData.type === "rescatado" ? "Rescatado/a o Localizado/a" :
                "Afectado/a"
              }</span>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-200 pt-4 space-y-4">
          <p className="text-sm text-gray-700 font-semibold">¿Qué desea hacer?</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`/buscar/${duplicateData.record.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ver registro existente
            </a>
            
            <button
              type="button"
              onClick={() => setShowInfoForm(true)}
              className="flex-1 rounded-lg bg-[#C0392B] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#A93226] transition-colors"
            >
              Aportar información adicional
            </button>
            
            <button
              type="button"
              onClick={() => {
                setDuplicateData(null);
                setShowInfoForm(false);
                setInfoSuccess(false);
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>

          {isAdminUser && (
            <div className="bg-amber-100/50 border border-amber-300/40 rounded-lg p-4 space-y-2">
              <p className="text-xs text-amber-800 font-bold">Autorización Administrativa Detectada:</p>
              <button
                type="button"
                onClick={async () => {
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
                      bypassDuplicateCheck: true,
                    });
                    if (res.error) {
                      setError(res.error);
                      setDuplicateData(null);
                    } else {
                      setSuccess(true);
                      setDuplicateData(null);
                    }
                  } catch (e) {
                    setError("Error al forzar registro");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full sm:w-auto rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#152e4f] transition-colors"
              >
                Forzar registro (Continuar)
              </button>
            </div>
          )}
        </div>

        {showInfoForm && (
          <div className="border-t border-amber-200 pt-6 space-y-4 bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900">Aportar Información Adicional</h4>
            {infoSuccess ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm text-green-800 font-bold">¡Información enviada con éxito!</p>
                <p className="text-xs text-green-600 mt-1">Los datos aportados serán validados por nuestro equipo de administración para complementar el registro existente.</p>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateData(null);
                    setShowInfoForm(false);
                    setInfoSuccess(false);
                  }}
                  className="mt-4 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={infoName}
                      onChange={(e) => setInfoName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono de Contacto *</label>
                    <input
                      type="tel"
                      required
                      value={infoPhone}
                      onChange={(e) => setInfoPhone(e.target.value)}
                      placeholder="Ej. 04141234567"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Información Adicional *</label>
                  <textarea
                    required
                    rows={3}
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    placeholder="Describe aquí cualquier información adicional, cambio de estado, o detalles de localización..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#0B1F3A] focus:outline-hidden resize-none"
                  />
                </div>
                {infoError && <p className="text-xs text-red-600 font-semibold">{infoError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInfoForm(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInfo}
                    className="rounded-lg bg-[#C0392B] px-4 py-2 text-xs font-bold text-white hover:bg-[#A93226] disabled:opacity-50"
                  >
                    {submittingInfo ? "Enviando..." : "Enviar Información"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
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
