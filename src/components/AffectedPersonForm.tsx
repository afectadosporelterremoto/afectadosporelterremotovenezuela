"use client";

import React, { useState } from "react";
import { registerAffectedPerson } from "@/app/actions";
import ImageUpload from "./ImageUpload";
import PrivacyNotice from "./PrivacyNotice";
import { VENEZUELAN_STATES } from "./SearchFilters";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function AffectedPersonForm() {
  // Estados del Formulario
  const [fullName, setFullName] = useState("");
  const [cedula, setCedula] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [parish, setParish] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState("Sin localizar");
  const [situationDescription, setSituationDescription] = useState("");
  const [personPhotoUrl, setPersonPhotoUrl] = useState("");
  const [placePhotoUrl, setPlacePhotoUrl] = useState("");
  const [registeredByName, setRegisteredByName] = useState("");
  const [registeredByPhone, setRegisteredByPhone] = useState("");
  const [consent, setConsent] = useState(false);

  // Honeypot
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");

  // Controladores de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateCedula = (val: string) => {
    // Expresión regular para validar cédula venezolana básica
    // Puede llevar prefijo V- o E- (opcional) y entre 5 y 9 dígitos
    const clean = val.replace(/[\s.-]/g, "");
    const regex = /^[VE]?[0-9]{5,9}$/i;
    return regex.test(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!fullName.trim()) return setError("El nombre completo es requerido.");
    
    if (cedula.trim() && !validateCedula(cedula)) {
      return setError("Formato de cédula incorrecto. Debe ser como V-12345678 o sólo números (entre 5 y 9 dígitos).");
    }

    if (!state) return setError("Por favor seleccione un estado.");
    if (!city.trim()) return setError("La ciudad es requerida.");
    if (!exactAddress.trim()) return setError("La dirección exacta es requerida.");
    if (!registeredByName.trim()) return setError("El nombre de quien registra es requerido.");
    if (!registeredByPhone.trim()) return setError("El teléfono de quien registra es requerido.");
    if (!consent) return setError("Debe otorgar el consentimiento para el tratamiento de los datos.");

    setLoading(true);

    try {
      const res = await registerAffectedPerson({
        fullName,
        cedula,
        phone,
        state,
        city,
        municipality,
        parish,
        exactAddress,
        referencePoint,
        latitude,
        longitude,
        status,
        situationDescription,
        personPhotoUrl,
        placePhotoUrl,
        registeredByName,
        registeredByPhone,
        consent,
        websiteHoneypot,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        // Reset
        setFullName("");
        setCedula("");
        setPhone("");
        setState("");
        setCity("");
        setMunicipality("");
        setParish("");
        setExactAddress("");
        setReferencePoint("");
        setLatitude(undefined);
        setLongitude(undefined);
        setStatus("Sin localizar");
        setSituationDescription("");
        setPersonPhotoUrl("");
        setPlacePhotoUrl("");
        setRegisteredByName("");
        setRegisteredByPhone("");
        setConsent(false);
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al enviar el formulario.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-xs">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-3 animate-pulse" />
        <h3 className="text-xl font-bold text-green-900">Registro Guardado Exitosamente</h3>
        <p className="text-sm text-green-700 mt-2 max-w-md mx-auto">
          La información ha sido guardada en nuestra base de datos segura y ya está disponible para consulta. Gracias por cooperar en esta labor humanitaria.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#152e4f] transition-colors"
        >
          Registrar otra persona
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xs max-w-3xl mx-auto">
      {/* Honeypot invisible */}
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
        <h2 className="text-lg font-bold text-gray-900 md:text-xl">Formulario de Registro de Afectado</h2>
        <p className="text-xs text-gray-500 mt-1">Registra la información de una persona afectada por el terremoto para facilitar su localización y ayuda.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start space-x-2 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Sección 1: Datos Personales del Afectado */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-[#0B1F3A] pl-2">
          1. Datos Personales del Afectado
        </h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullname" className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo *</label>
            <input
              id="fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Juan Andrés Pérez Gómez"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
          
          <div>
            <label htmlFor="cedula" className="block text-sm font-semibold text-gray-700 mb-1">Cédula de Identidad (Opcional)</label>
            <input
              id="cedula"
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej. V-12345678 o 12345678"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">Teléfono de Contacto (Opcional)</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 04141234567"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">Situación Actual *</label>
            <select
              id="status"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            >
              <option value="Sin localizar">Sin localizar</option>
              <option value="Localizado">Localizado</option>
              <option value="Rescatado">Rescatado</option>
              <option value="Hospitalizado">Hospitalizado</option>
              <option value="Fallecido">Fallecido</option>
              <option value="Necesita ayuda">Necesita ayuda</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="situation" className="block text-sm font-semibold text-gray-700 mb-1">Descripción de la Situación</label>
          <textarea
            id="situation"
            value={situationDescription}
            onChange={(e) => setSituationDescription(e.target.value)}
            rows={3}
            placeholder="Detalles sobre su estado de salud, necesidades inmediatas, si está atrapado, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImageUpload onUploadComplete={setPersonPhotoUrl} label="Foto del Afectado (Opcional)" placeholder="Foto de la persona" />
          <ImageUpload onUploadComplete={setPlacePhotoUrl} label="Foto de la Vivienda/Estructura Afectada (Opcional)" placeholder="Foto de la vivienda" />
        </div>
      </div>

      {/* Sección 2: Ubicación */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-[#0B1F3A] pl-2">
          2. Ubicación donde se encontraba
        </h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1">Estado *</label>
            <select
              id="state"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            >
              <option value="">Seleccione un estado</option>
              {VENEZUELAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1">Ciudad *</label>
            <input
              id="city"
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Caracas / Guarenas"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="municipality" className="block text-sm font-semibold text-gray-700 mb-1">Municipio (Opcional)</label>
            <input
              id="municipality"
              type="text"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="Ej. Chacao / Plaza"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="parish" className="block text-sm font-semibold text-gray-700 mb-1">Parroquia (Opcional)</label>
            <input
              id="parish"
              type="text"
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              placeholder="Ej. El Recreo / Guarenas"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">Dirección Exacta (Calle, Av, Edificio, Casa) *</label>
          <input
            id="address"
            type="text"
            required
            value={exactAddress}
            onChange={(e) => setExactAddress(e.target.value)}
            placeholder="Ej. Calle Principal, Sector La Lucha, Casa Nro 45"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="reference" className="block text-sm font-semibold text-gray-700 mb-1">Punto de Referencia</label>
          <input
            id="reference"
            type="text"
            value={referencePoint}
            onChange={(e) => setReferencePoint(e.target.value)}
            placeholder="Ej. Detrás del abasto El Progreso, frente al poste 4"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lat" className="block text-sm font-semibold text-gray-700 mb-1">Latitud (Opcional)</label>
            <input
              id="lat"
              type="number"
              step="any"
              value={latitude || ""}
              onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ej. 10.4880"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-semibold text-gray-700 mb-1">Longitud (Opcional)</label>
            <input
              id="lng"
              type="number"
              step="any"
              value={longitude || ""}
              onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ej. -66.8791"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Sección 3: Datos de quien reporta */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-l-4 border-[#0B1F3A] pl-2">
          3. Datos de Quien Registra
        </h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reporter_name" className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo *</label>
            <input
              id="reporter_name"
              type="text"
              required
              value={registeredByName}
              onChange={(e) => setRegisteredByName(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="reporter_phone" className="block text-sm font-semibold text-gray-700 mb-1">Teléfono de Contacto *</label>
            <input
              id="reporter_phone"
              type="tel"
              required
              value={registeredByPhone}
              onChange={(e) => setRegisteredByPhone(e.target.value)}
              placeholder="Tu número telefónico"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B1F3A] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Consentimiento y Seguridad */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <PrivacyNotice />
        
        <div className="flex items-start space-x-2">
          <input
            id="consent-check"
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-[#0B1F3A] focus:ring-[#0B1F3A]"
          />
          <label htmlFor="consent-check" className="text-xs text-gray-600 leading-tight">
            Confirmo que la información suministrada es verídica y doy consentimiento para el tratamiento humanitario y de localización de estos datos. *
          </label>
        </div>
      </div>

      {/* Botón de Enviar */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-[#0B1F3A] py-3 text-base font-bold text-white hover:bg-[#152e4f] transition-colors sm:w-auto sm:px-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Guardando registro...</span>
            </>
          ) : (
            <span>Registrar Afectado</span>
          )}
        </button>
      </div>
    </form>
  );
}
